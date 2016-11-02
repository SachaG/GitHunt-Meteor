export const Comments = new Mongo.Collection('comments');
export const Entries = new Mongo.Collection('entries');

Comments.getCommentCount = repositoryName => {
  console.log(Comments.find({repositoryName: repositoryName}).count())
  return 3;
  return Comments.find({repositoryName: repositoryName}).count();
}

Entries.haveVotedForEntry = (repositoryName, username) => {
  return null;
}