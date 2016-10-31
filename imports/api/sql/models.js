import RedditScore from 'reddit-score';

import knex from './connector';

// A utility function that makes sure we always query the same columns
function addSelectToEntryQuery(query) {
  query.select('entries.*', knex.raw('SUM(votes.vote_value) as score'))
    .leftJoin('votes', 'entries.id', 'votes.entry_id')
    .groupBy('entries.id');
}

// If we don't have a score, it is NULL by default
// Convert it to 0 on read.
function handleNullScoreInRow({ score, ...rest }) {
  return {
    score: score || 0,
    ...rest,
  };
}

// Given a Knex query promise, resolve it and then format one or more rows
function formatRows(query) {
  return query.then((rows) => {
    if (rows.map) {
      return rows.map(handleNullScoreInRow);
    }
    return handleNullScoreInRow(rows);
  });
}

export class Comments {
  getCommentById(id) {
    const query = knex('comments')
      .where({ id });
    return query.then(([row]) => row);
  }

  getCommentsByRepoName(name) {
    const query = knex('comments')
      .where({ repository_name: name })
      .orderBy('created_at', 'desc');
    return query.then(rows => (rows || []));
  }

  getCommentCount(name) {
    const query = knex('comments')
      .where({ repository_name: name })
      .count();
    return query.then(rows => rows.map(row => (row['count(*)'] || '0')));
  }

  submitComment(repoFullName, username, content) {
    return knex.transaction(trx => trx('comments')
      .insert({
        content,
        created_at: Date.now(),
        repository_name: repoFullName,
        posted_by: username,
      }));
  }
}
export class Entries {
  getForFeed(type, offset, limit) {
    const query = knex('entries')
      .modify(addSelectToEntryQuery);

    if (type === 'NEW') {
      query.orderBy('created_at', 'desc');
    } else if (type === 'TOP') {
      query.orderBy('score', 'desc');
    } else if (type === 'HOT') {
      query.orderBy('hot_score', 'desc');
    } else {
      throw new Error(`Feed type ${type} not implemented.`);
    }

    if (offset > 0) {
      query.offset(offset);
    }

    query.limit(limit);

    return formatRows(query);
  }

  getByRepoFullName(name) {
    // No need to batch
    const query = knex('entries')
      .modify(addSelectToEntryQuery)
      .where({
        repository_name: name,
      })
      .first();

    return formatRows(query);
  }

  voteForEntry(repoFullName, voteValue, username) {
    let entry_id;

    return Promise.resolve()

      // First, get the entry_id from repoFullName
      .then(() => (
        knex('entries')
          .where({
            repository_name: repoFullName,
          })
          .select(['id'])
          .first()
          .then(({ id }) => {
            entry_id = id;
          })
      ))
      // Remove any previous votes by this person
      .then(() => (
        knex('votes')
          .where({
            entry_id,
            username,
          })
          .delete()
      ))
      // Then, insert a vote
      .then(() => (
        knex('votes')
          .insert({
            entry_id,
            username,
            vote_value: voteValue,
          })
      ))
      // Update hot score
      .then(() => this.updateHotScore(repoFullName));
  }

  updateHotScore(repoFullName) {
    let entryId;
    let createdAt;

    return Promise.resolve()
      .then(() => (
        knex('entries')
          .where({
            repository_name: repoFullName,
          })
          .select(['id', 'created_at'])
          .first()
          .then(({ id, created_at }) => {
            entryId = id;
            createdAt = created_at;
          })
      ))
      .then(() => {
        return knex('votes')
          .select(['vote_value'])
          .where({
            entry_id: entryId,
          });
      })
      .then((results) => {
        function countVotes(vote) {
          return (count, value) => count + (value === vote ? 1 : 0);
        }

        if (results && results.map) {
          const votes = results.map(vote => vote.vote_value);
          const ups = votes.reduce(countVotes(1), 0);
          const downs = votes.reduce(countVotes(-1), 0);
          const date = createdAt instanceof Date ? createdAt : new Date(createdAt);

          return (new RedditScore()).hot(ups, downs, date);
        }

        return 0;
      })
      .then(hotScore => (
        knex('entries')
          .where('id', entryId)
          .update({
            hot_score: hotScore,
          })
      ));
  }

  haveVotedForEntry(repoFullName, username) {
    let entry_id;

    return Promise.resolve()

    // First, get the entry_id from repoFullName
      .then(() => (
        knex('entries')
          .where({
            repository_name: repoFullName,
          })
          .select(['id'])
          .first()
          .then(({ id }) => {
            entry_id = id;
          })
      ))

      .then(() => (
        knex('votes')
          .where({
            entry_id,
            username,
          })
          .select(['id', 'vote_value'])
          .first()
      ))

      .then(vote => vote || { vote_value: 0 });
  }

  submitRepository(repoFullName, username) {
    const rateLimitMs = 60 * 60 * 1000;
    const rateLimitThresh = 3;

    // Rate limiting logic
    return knex.transaction(trx => trx('entries')
      .count()
      .where('posted_by', '=', username)
      .where('created_at', '>', Date.now() - rateLimitMs)
      .then((obj) => {
        // If the user has already submitted too many times, we don't
        // post the repo.
        const postCount = obj[0]['count(*)'];
        if (postCount > rateLimitThresh) {
          throw new Error('Too many repos submitted in the last hour!');
        } else {
          return trx('entries')
            .insert({
              created_at: Date.now(),
              updated_at: Date.now(),
              repository_name: repoFullName,
              posted_by: username,
            });
        }
      }))
      .then(() => this.updateHotScore(repoFullName));
  }
}
