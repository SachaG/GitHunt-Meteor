import _ from 'lodash';
import RedditScore from 'reddit-score';

function countScore(score) {
  return (count, value) => count + (value === score ? 1 : 0);
}

function hot(repoVotes, date) {
  const redditScore = new RedditScore();

  const createdAt = date instanceof Date ? date : new Date(date);

  const scores = _.values(repoVotes || {});
  const ups = scores.reduce(countScore(1), 0);
  const downs = scores.reduce(countScore(-1), 0);

  return redditScore.hot(ups, downs, createdAt);
}

const repos = [
  {
    repository_name: 'apollostack/apollo-client',
    posted_by: 'stubailo',
  },
  {
    repository_name: 'apollostack/graphql-server',
    posted_by: 'helfer',
  },
  {
    repository_name: 'meteor/meteor',
    posted_by: 'tmeasday',
  },
  {
    repository_name: 'twbs/bootstrap',
    posted_by: 'Slava',
  },
  {
    repository_name: 'd3/d3',
    posted_by: 'Slava',
  },
  {
    repository_name: 'angular/angular.js',
    posted_by: 'Slava',
  },
  {
    repository_name: 'facebook/react',
    posted_by: 'Slava',
  },
  {
    repository_name: 'jquery/jquery',
    posted_by: 'Slava',
  },
  {
    repository_name: 'airbnb/javascript',
    posted_by: 'Slava',
  },
  {
    repository_name: 'facebook/react-native',
    posted_by: 'Slava',
  },
  {
    repository_name: 'torvalds/linux',
    posted_by: 'Slava',
  },
  {
    repository_name: 'daneden/animate.css',
    posted_by: 'Slava',
  },
  {
    repository_name: 'electron/electron',
    posted_by: 'Slava',
  },
  {
    repository_name: 'docker/docker',
    posted_by: 'Slava',
  },
];

const repoIds = {};

const votes = {
  [repos[0].repository_name]: {
    stubailo: 1,
    helfer: 1,
  },
  [repos[1].repository_name]: {
    helfer: 1,
  },
  [repos[2].repository_name]: {

  },
};

export function seed(knex, Promise) {
  return Promise.all([
    knex('entries').del(),
    knex('votes').del(),
  ])

  // Insert some entries for the repositories
  .then(() => {
    return Promise.all(repos.map(({ repository_name, posted_by }, i) => {
      const createdAt = Date.now() - (i * 10000);
      const repoVotes = votes[repository_name];
      const hotScore = hot(repoVotes, createdAt);

      return knex('entries').insert({
        created_at: createdAt,
        updated_at: Date.now() - (i * 10000),
        repository_name,
        posted_by,
        hot_score: hotScore,
      }).then(([id]) => {
        repoIds[repository_name] = id;
      });
    }));
  })

  // Insert some votes so that we can render a sorted feed
  .then(() => {
    return Promise.all(_.toPairs(votes).map(([repoName, voteMap]) => {
      return Promise.all(_.toPairs(voteMap).map(([username, vote_value]) => {
        return knex('votes').insert({
          entry_id: repoIds[repoName],
          vote_value,
          username,
        });
      }));
    }));
  });
}
