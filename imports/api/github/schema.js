import { property } from 'lodash';

export const schema = [`
# A repository object from the GitHub API. This uses the exact field names returned by the
# GitHub API for simplicity, even though the convention for GraphQL is usually to camel case.
type Repository {
  # Just the name of the repository, e.g. GitHunt-API
  name: String!

  # The full name of the repository with the username, e.g. apollostack/GitHunt-API
  full_name: String!

  # The description of the repository
  description: String

  # The link to the repository on GitHub
  html_url: String!

  # The number of people who have starred this repository on GitHub
  stargazers_count: Int!

  # The number of open issues on this repository on GitHub
  open_issues_count: Int

  # The owner of this repository on GitHub, e.g. apollostack
  owner: User
}

# A user object from the GitHub API. This uses the exact field names returned from the GitHub API.
type User {
  # The name of the user, e.g. apollostack
  login: String!

  # The URL to a directly embeddable image for this user's avatar
  avatar_url: String!

  # The URL of this user's GitHub page
  html_url: String!
}
`];

export const resolvers = {
  Repository: {
    owner: property('owner'),
  },
};
