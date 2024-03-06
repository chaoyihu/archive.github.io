---
layout: post
title: "Quick Note: Resetting an Unwanted Merge Commit in Git"
date: 2024-03-05
tags: [Git]
categories: [developer]
description: "This post documents a quick solution to reset a commit."
---

# The problem

I was working on some code changes on my fork. I made a commit A from CLI containing my local changes, and accepted code review suggestions in commit B.

My work is not finished yet, so what I should have done next was to pull the revised code and continue to work on it. However, at this point, I synced fork by mistake, resulting in an unwanted merge commit D.

Here is what the log tree looks like:

```
                  (...)
     D is a         |    Other developers
     premature  D   E    are actively
     merge      |\  |    working here
                | \ |
                |  \|
                B   C
                |   |
                |   | 
                A   |
                 \  |
        bugfix    \ |     dev
                   \|
                    O
```

I need to undo the premature merge to avoid potential conflicts caused by changes in commit C that got mixed into my bugfix branch.

> **NOTE** 
> - Stash, commit, or save any local changes you want to keep in a temporary branch before trying any fixes.


# The Fix

Following illustrations show an excerpt of the relevant part of the log tree.

1. Checkout the bugfix branch

    Effects: This will switch to the `bugfix` branch by updating the index and the files in the working tree, and by pointing HEAD at the `bugfix` branch head.

    ```shell
    git checkout bugfix
    ```

    ```shell
    *   commit D (origin/bugfix)
    |\  Merge: B C
    | | Author: My GitHub Account
    | |     A merge performed by GitHub when I synced fork.
    | |   
    | * commit C (origin/main, origin/HEAD)
    | | Author: DeveloperA
    | |
    * | commit B
    | | Author: My GitHub Account
    | |     Accepted code review suggestions from remote.
    | |   
    * | commit A (HEAD -> bugfix)
    |/  Author: Me
    |       Some changes made from CLI.
    ```

2. Hard reset to commit B

    Effects: This resets the `bugfix` branch head and HEAD to commit B. The index and working tree are reset. Any changes to tracked files in the working tree since commit B are discarded. Any untracked files or directories in the way of writing any tracked files are simply deleted.

    ```shell
    git reset --hard <commit B>
    ```

    ```shell
    *   commit D (origin/bugfix)
    |\  Merge: B C
    | | Author: My GitHub Account
    | |     A merge performed by GitHub when I synced fork.
    | |   
    | * commit C (origin/main, origin/HEAD)
    | | Author: DeveloperA
    | |
    * | commit B (HEAD -> bugfix)
    | | Author: My GitHub Account
    | |     Accepted code review suggestions from remote.
    | |   
    * | commit A
    |/  Author: Me
    |       Some changes made from CLI.
    ```

3. Force push to the bugfix branch

    Effects: This will cause history to be modified on local and remote. Commit D is now a dangling commit, still existing but unreferenced. If commit D ever needs to be retrieved, try `git reflog` before it is garbage collected - though a hard reset should not have been performed in the first place if the work was meant to be kept.

    >**How does force push affect other developers?**
    >
    > This is always a question to think about before executing any git commands.
    >
    > The force push will not cause conflict in this case, because no other developers have pulled changes from the `origin/bugfix` since commit B.

    ```shell
    git push -f origin bugfix
    ```

    ```shell
    * commit B (HEAD -> bugfix, origin/bugfix)
    | Author: My GitHub Account
    |     Accepted code review suggestions from remote.
    |     
    * commit A
    | Author: Me
    |     Some changes made from CLI.
    |
    | * commit C (origin/main, origin/HEAD)
    |/  Author: DeveloperA
    |
    ```

Now the premature merge has been undone, and I can keep working on `bugfix` branch until the fix is completed.

ʕ•́ᴥ•̀ʔっ Thanks for reading!