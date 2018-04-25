
# Dox

* Dox is a simple browser app for viewing Magivi repos.
* It renders markdown files in the browser and supports navigation via the [Conventions](../conventions)
* It spiders the "published" folders and files, starting at `README.md` in the root folder.
* It caches the spidered files in the browser's indexedDB cache for blazing-fast performance, on- and off-line.
* It also supports simple document search in-browser - again, off-line and avoiding server-side resources.
