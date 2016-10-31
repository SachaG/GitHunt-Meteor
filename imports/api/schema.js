import { merge } from 'lodash';
import { schema as gitHubSchema, resolvers as gitHubResolvers } from './github/schema';
import { schema as sqlSchema, resolvers as sqlResolvers } from './sql/schema';
import { makeExecutableSchema } from 'graphql-tools';
import { pubsub } from './subscriptions';

const rootSchema = [`

# A list of options for the sort order of the feed
enum FeedType {
  # Sort by a combination of freshness and score, using Reddit's algorithm
  HOT

  # Newest entries first
  NEW

  # Highest score entries first
  TOP
}

type Query {
  # A feed of repository submissions
  feed(
    # The sort order for the feed
    type: FeedType!,

    # The number of items to skip, for pagination
    offset: Int,

    # The number of items to fetch starting from the offset, for pagination
    limit: Int
  ): [Entry]

  # A single entry
  entry(
    # The full repository name from GitHub, e.g. "apollostack/GitHunt-API"
    repoFullName: String!
  ): Entry

  # Return the currently logged in user, or null if nobody is logged in
  currentUser: User
}

# The type of vote to record, when submitting a vote
enum VoteType {
  UP
  DOWN
  CANCEL
}

type Mutation {
  # Submit a new repository, returns the new submission
  submitRepository(
    # The full repository name from GitHub, e.g. "apollostack/GitHunt-API"
    repoFullName: String!
  ): Entry

  # Vote on a repository submission, returns the submission that was voted on
  vote(
    # The full repository name from GitHub, e.g. "apollostack/GitHunt-API"
    repoFullName: String!,

    # The type of vote - UP, DOWN, or CANCEL
    type: VoteType!
  ): Entry

  # Comment on a repository, returns the new comment
  submitComment(
    # The full repository name from GitHub, e.g. "apollostack/GitHunt-API"
    repoFullName: String!,

    # The text content for the new comment
    commentContent: String!
  ): Comment
}

type Subscription {
  # Subscription fires on every comment added
  commentAdded(repoFullName: String!): Comment
}

schema {
  query: Query
  mutation: Mutation
  subscription: Subscription
}

`];

const rootResolvers = {
  Query: {
    feed(root, { type, offset, limit }, context) {
      // Ensure API consumer can only fetch 10 items at most
      const protectedLimit = (limit < 1 || limit > 10) ? 10 : limit;

      return context.Entries.getForFeed(type, offset, protectedLimit);
    },
    entry(root, { repoFullName }, context) {
      return context.Entries.getByRepoFullName(repoFullName);
    },
    currentUser(root, args, context) {
      return context.user || null;
    },
  },
  Mutation: {
    submitRepository(root, { repoFullName }, context) {
      if (!context.user) {
        throw new Error('Must be logged in to submit a repository.');
      }

      return Promise.resolve()
        .then(() => (
          context.Repositories.getByFullName(repoFullName)
            .catch(() => {
              throw new Error(`Couldn't find repository named "${repoFullName}"`);
            })
        ))
        .then(() => (
          context.Entries.submitRepository(repoFullName, context.user.login)
        ))
        .then(() => context.Entries.getByRepoFullName(repoFullName));
    },

    submitComment(root, { repoFullName, commentContent }, context) {
      if (!context.user) {
        throw new Error('Must be logged in to submit a comment.');
      }
      return Promise.resolve()
        .then(() => (
          context.Comments.submitComment(
            repoFullName,
            context.user.login,
            commentContent
          )
        ))
        .then(([id]) =>
          context.Comments.getCommentById(id)
        )
        .then((comment) => {
          // publish subscription notification
          pubsub.publish('commentAdded', comment);
          return comment;
        });
    },

    vote(root, { repoFullName, type }, context) {
      if (!context.user) {
        throw new Error('Must be logged in to vote.');
      }

      const voteValue = {
        UP: 1,
        DOWN: -1,
        CANCEL: 0,
      }[type];

      return context.Entries.voteForEntry(
        repoFullName,
        voteValue,
        context.user.login
      ).then(() => (
        context.Entries.getByRepoFullName(repoFullName)
      ));
    },
  },
  Subscription: {
    commentAdded(comment) {
      // the subscription payload is the comment.
      return comment;
    },
  },
};

// Put schema together into one array of schema strings
// and one map of resolvers, like makeExecutableSchema expects
const schema = [...rootSchema, ...gitHubSchema, ...sqlSchema];
const resolvers = merge(rootResolvers, gitHubResolvers, sqlResolvers);

const executableSchema = makeExecutableSchema({
  typeDefs: schema,
  resolvers,
});

export default executableSchema;
