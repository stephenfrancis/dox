# doc_reader
Browser viewer for markdown repos

All the code is client-side, so it can be deployed on any web server that can serve up static content.

1. Ensure this repo is in the web server's webapps directory, alongside all markdown repos to be accessible.
2. In Reader.js, ensure that the 'all_repos' array is a list of the string names of the markdown repos, and
   that the 'default_repo' property points to one of them. (NOTE: it might be better to have a saparate index.md
   file as the landing page for the app, linking to other repos as required).
