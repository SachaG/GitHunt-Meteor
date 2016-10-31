import React from 'react';
import ApolloClient from 'apollo-client';
import { withApollo } from 'react-apollo';
import { Link } from 'react-router';
import gql from 'graphql-tag';
import Fragment from 'graphql-fragments';

import VoteButtons from './VoteButtons';
import RepoInfo from './RepoInfo';
import CommentsPage, { COMMENT_QUERY } from '../routes/CommentsPage';

const FeedEntry = ({
  loggedIn,
  onVote,
  entry,
  client,
}) => {
  const {
    commentCount,
    repository: {
      full_name,
      html_url,
      owner: {
        avatar_url,
      },
    },
  } = entry;

  const repoLink = `/${full_name}`;
  const prefetchComments = repoFullName => () => {
    client.query({
      query: COMMENT_QUERY,
      variables: { repoName: repoFullName },
      fragments: CommentsPage.fragments.comment.fragments(),
    });
  };

  return (
    <div className="media">
      <div className="media-vote">
        <VoteButtons
          canVote={loggedIn}
          entry={VoteButtons.fragments.entry.filter(entry)}
          onVote={type => onVote({
            repoFullName: full_name,
            type,
          })}
        />
      </div>
      <div className="media-left">
        <button>
          <img
            className="media-object"
            style={{ width: '64px', height: '64px' }}
            src={avatar_url}
            role="presentation"
          />
        </button>
      </div>
      <div className="media-body">
        <h4 className="media-heading">
          <a href={html_url}>{full_name}</a>
        </h4>
        <RepoInfo entry={RepoInfo.fragments.entry.filter(entry)} >
          <Link to={repoLink} onMouseOver={prefetchComments(entry.repository.full_name)}>
            View comments ({commentCount})
          </Link>
        </RepoInfo>
      </div>
    </div>
  );
};

FeedEntry.fragments = {
  entry: new Fragment(gql`
    fragment FeedEntry on Entry {
      commentCount
      repository {
        full_name
        html_url
        owner {
          avatar_url
        }
      }
      ...VoteButtons
      ...RepoInfo
    }
  `, VoteButtons.fragments.entry, RepoInfo.fragments.entry),
};

FeedEntry.propTypes = {
  loggedIn: React.PropTypes.bool.isRequired,
  onVote: React.PropTypes.func.isRequired,
  entry: FeedEntry.fragments.entry.propType,
  client: React.PropTypes.instanceOf(ApolloClient).isRequired,
};

export default withApollo(FeedEntry);
