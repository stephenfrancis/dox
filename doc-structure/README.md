# Doc Structure

- All (relevant) folders of your repo (including the root folder) contain `README.md`
- All (relevant) markdown documents in each folder are linked to by `README.md` of that folder
- All (relevant) folders within a folder are linked to by `README.md` of that folder
- All markdown documents have the suffix `.md`

In the above, "relevant" means the content you want to be accessible through the Dox front-end. Folders and
documents that don't conform to the above will be silently ignored.

## Principles

- The hierarchy is the main organizing structure
- Keep non-leaf nodes (i.e. have children) are brief as possible
- Stub freely!
- Cross-link freely!
