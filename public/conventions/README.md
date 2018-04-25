
# Conventions

Magivi is basically a git repo of markdown documents that follow some conventions:

* All links within the repo should be relative.
* Every (published) folder contains a `README.md` file that acts as the "index" for the folder.
* Every (published) file is linked to from the `README.md` file of its folder.
* Every (published) folder below root is linked to from the `README.md` file of its parent folder.
* The root folder is published.
* There should be no links to any `README.md` - there should be links to folders instead, with no trailing slash.
* If a `README.md` must contain links other than to direct child markdown files and folders,
  these should be in a clearly-delineated second section of the file.


In the above, "published" = accessible.

See also [Tools](../tools).
