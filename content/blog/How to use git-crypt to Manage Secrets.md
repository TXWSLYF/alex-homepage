---
author: Alex
pubDatetime: 2023-09-01T10:33:00+09:00
title: How to use git-crypt to Manage Secrets
postSlug: ""
tags:
  - git
  - git-crypt
featured: false
draft: false
ogImage: ""
description: How to use git-crypt to Manage Secrets
---

When we want to deploy a service, we often have many secrets such as database connection information, API keys for third-party service verification, and more. Typically, we don't want to expose these secrets, so we generally avoid storing these details in the Git repository. Instead, we place them directly on our server for service deployment.But it's kind of difficult to manage these secrets since we don't have version controll.

[git-crypt](https://github.com/AGWA/git-crypt) was created specifically to address this issue. It provides a mechanism for encrypting files, ensuring that we don't have to worry about sensitive information being exposed, even if it's stored in a public Git repository.

## 1.Install

For MacOS

```bash
brew install git-crypt
```

Building from Source

```bash
yum install gcc-c++ openssl-devel -y
git clone git@github.com:AGWA/git-crypt.git
cd git-crypt/
make
make install PREFIX=/usr/local
```

## 2.Set up the repository to use git-crypt

init

```bash
cd /path/of/your/git/repository
git-crypt init
```

export the secret key

```bash
git-crypt export-key /path/to/keyfile
```

## 3.Tell git-crypt which files to encrypt

```bash
touch .gitattributes
echo ".env filter=git-crypt diff=git-crypt" > .gitattributes
git add .gitattributes
git commit -m "Tell git-crypt to encrypt .env"
```

## 4.Add a secret

now we can create a `.env` file to store sensitive data for our services.

```bash
touch .env
echo "some sensitive data" > .env
git add .env
git commit -m "add .env file"
```

## 5.Confirm our secret is encrypted

now we run the `cat .env` command we can see

```bash
some sensitive data
```

we can also run the `git show` command to see the latest diff

```bash
    add .env file

diff --git a/.env b/.env
new file mode 100644
index 0000000..06acade
--- /dev/null
+++ b/.env
@@ -0,0 +1 @@
+some sensitive data
```

It seems that nothing is different, the `.env` file is still cleartext file.
However, if you push the commit to your remote repository, you will see that the .env file is indeed encrypted.

We can also confirm it by run the `git-crypt lock` command, after run the command, now we can see our repository.

run the `cat .env` command

```bash
GITCRYPT)y�xBKY�H��uWe��=�v3qs�$NR�WE�!%
```

run the `git show` command

```bash
    add .env file

diff --git a/.env b/.env
new file mode 100644
index 0000000..06acade
Binary files /dev/null and b/.env differ
```

We can see it did work!

## Unlock the repository

Remember that we exported a keyfile at beginning, we can use it to decrypt our repository.

```bash
git-crypt unlock /path/to/keyfile
```
