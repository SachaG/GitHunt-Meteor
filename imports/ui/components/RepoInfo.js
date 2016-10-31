import React from 'react';
import TimeAgo from 'react-timeago';
import { emojify } from 'node-emoji';
import gql from 'graphql-tag';

import Fragment from 'graphql-fragments';

import InfoLabel from './InfoLabel';

export default function RepoInfo({
  entry: {
    createdAt,
    repository: {
      description,
      stargazers_count,
      open_issues_count,
    },
    postedBy: {
      html_url,
      login,
    },
  },
  children,
}) {
  return (
    <div>
      <p>
        {description && emojify(description)}
      </p>
      <p>
        <InfoLabel
          label="Stars"
          value={stargazers_count}
        />
        &nbsp;
        <InfoLabel
          label="Issues"
          value={open_issues_count}
        />
        &nbsp;
        {children}
        &nbsp;&nbsp;&nbsp;
        Submitted&nbsp;
        <TimeAgo
          date={createdAt}
        />
        &nbsp;by&nbsp;
        <a href={html_url}>{login}</a>
      </p>
    </div>
  );
}

RepoInfo.fragments = {
  entry: new Fragment(gql`
    fragment RepoInfo on Entry {
      createdAt
      repository {
        description
        stargazers_count
        open_issues_count
      }
      postedBy {
         html_url
         login
      }
    }
  `),
};

RepoInfo.propTypes = {
  entry: RepoInfo.fragments.entry.propType,
  children: React.PropTypes.node,
};
