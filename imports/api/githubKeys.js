import dotenv from 'dotenv';

dotenv.config({ silent: true });

try {
  export const {
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
  } = Meteor.settings;

  ServiceConfiguration.configurations.upsert({service: 'github'}, {
    $set: { client_id: GITHUB_CLIENT_ID, secret: GITHUB_CLIENT_SECRET }
  });

} catch (error) {
  console.log(Meteor.settings)
  console.log('Please load a Meteor settings file containing the GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET values.')
}
