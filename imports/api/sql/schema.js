import { property, constant } from 'lodash';

export const schema = [`

# A comment about an entry, submitted by a user
type Comment {
  # The SQL ID of this entry
  id: Int!

  # The GitHub user who posted the comment
  postedBy: User!

  # A timestamp of when the comment was posted
  createdAt: Float! # Actually a date

  # The text of the comment
  content: String!

  # The repository which this comment is about
  repoName: String!
}

# XXX to be removed
type Vote {
  vote_value: Int!
}

# Information about a GitHub repository submitted to GitHunt
type Entry {
  # Information about the repository from GitHub
  repository: Repository!

  # The GitHub user who submitted this entry
  postedBy: User!

  # A timestamp of when the entry was submitted
  createdAt: Float! # Actually a date

  # The score of this repository, upvotes - downvotes
  score: Int!

  # The hot score of this repository
  hotScore: Int!

  # Comments posted about this repository
  comments: [Comment]! # Should this be paginated?

  # The number of comments posted about this repository
  commentCount: Int!

  # The SQL ID of this entry
  id: Int!

  # XXX to be changed
  vote: Vote!
}

`];

export const resolvers = {
  Entry: {
    repository({ repository_name }, _, context) {
      return context.Repositories.getByFullName(repository_name);
    },
    postedBy({ posted_by }, _, context) {
      return context.Users.getByLogin(posted_by);
    },
    comments({ repository_name }, _, context) {
      return context.Comments.getCommentsByRepoName(repository_name);
    },
    createdAt: property('created_at'),
    hotScore: property('hot_score'),
    commentCount({ repository_name }, _, context) {
      return context.Comments.getCommentCount(repository_name) || constant(0);
    },
    vote({ repository_name }, _, context) {
      if (!context.user) return { vote_value: 0 };
      return context.Entries.haveVotedForEntry(repository_name, context.user.login);
    },
  },

  Comment: {
    createdAt: property('created_at'),
    postedBy({ posted_by }, _, context) {
      return context.Users.getByLogin(posted_by);
    },
  },
};
