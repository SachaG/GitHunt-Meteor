import React from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { Link } from 'react-router';
import { Accounts } from 'meteor/std:accounts-ui';

function Profile({ loading, currentUser }) {
  if (loading) {
    return (
      <p className="navbar-text navbar-right">
        Loading...
      </p>
    );
  } else if (currentUser) {
    return (
      <span>
        <p className="navbar-text navbar-right">
          {currentUser.services.github.username}
          &nbsp;
          <a href="/logout">Log out</a>
        </p>
        <Link
          type="submit"
          className="btn navbar-btn navbar-right btn-success"
          to="/submit"
        >
          <span
            className="glyphicon glyphicon-plus"
            aria-hidden="true"
          />
          &nbsp;
          Submit
        </Link>
      </span>
    );
  }
  return (
    <div className="navbar-text navbar-right">
      <Accounts.ui.LoginForm />
    </div>
  );
}

Profile.propTypes = {
  loading: React.PropTypes.bool,
  currentUser: React.PropTypes.shape({
    services: React.PropTypes.shape({
      github: React.PropTypes.shape({
        username: React.PropTypes.string.isRequired,
      }),
    }),
  }),
};

const PROFILE_QUERY = gql`
  query CurrentUserForLayout {
    currentUser {
      services {
        github {
          username
        }
      }
    }
  }
`;

export default graphql(PROFILE_QUERY, {
  options: { forceFetch: true },
  props({ data: { loading, currentUser } }) {
    return { loading, currentUser };
  },
})(Profile);
