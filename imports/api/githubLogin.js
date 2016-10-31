import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github';
import knex from './sql/connector';

import {
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
} from './githubKeys';

const KnexSessionStore = require('connect-session-knex')(session);

const store = new KnexSessionStore({
  knex,
});

export function setUpGitHubLogin(app) {
  app.use(session({
    secret: 'your secret',
    resave: true,
    saveUninitialized: true,
    store,
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  app.use(express.static('dist'));

  app.get('/login/github',
    passport.authenticate('github'));

  app.get('/login/github/callback',
    passport.authenticate('github', { failureRedirect: '/' }),
    (req, res) => res.redirect('/'));

  app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
  });
}

const gitHubStrategyOptions = {
  clientID: GITHUB_CLIENT_ID,
  clientSecret: GITHUB_CLIENT_SECRET,
  callbackURL: 'http://localhost:3000/login/github/callback',
};

passport.use(new GitHubStrategy(gitHubStrategyOptions, (accessToken, refreshToken, profile, cb) => {
  cb(null, profile);
}));

passport.serializeUser((user, cb) => cb(null, user));
passport.deserializeUser((obj, cb) => cb(null, obj));
