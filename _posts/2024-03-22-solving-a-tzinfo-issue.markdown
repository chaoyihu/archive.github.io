---
layout: post
title: "Investigating a timezone configuring issue in Docker"
date: 2024-03-22
tags: [Linux, Docker]
categories: [developer]
description: "Documenting my investigation of a timezone issue: `RUN cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime` caused incorrect results of utcoffset."
---

The debugging here is related to [this issue in the cpython repo](https://github.com/python/cpython/issues/116676)/

# Describe the issue

When attempting to change system timezone config in a Docker container by running a build-time copy command from /usr/share/zoneinfo/Asia/Shanghai to /etc/localtime, zoneinfo.ZoneInfo("UTC").utcoffset() gives the wrong result.

**Reproduce:**

`script.py`
```python
import zoneinfo
import datetime
print("UTC", str(zoneinfo.ZoneInfo("UTC").utcoffset(datetime.datetime(2024, 3, 12, 0, 0, 0, 0))))
print("Asia/Shanghai", str(zoneinfo.ZoneInfo("Asia/Shanghai").utcoffset(datetime.datetime(2024, 3, 12, 0, 0, 0, 0))))
```

`Dockerfile`
```
FROM python:3.10-slim
RUN cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime

COPY . .
CMD ["sh", "-c", "python script.py"]
```

Expected output:
```
UTC 0:00:00
Asia/Shanghai 8:00:00
```

Actual output:
```
UTC 8:00:00
Asia/Shanghai 8:00:00
```

# Tracing

The behavior of `ZoneInfo(key)` is documented in `zoneinfo.rst`:

```m
When ``ZoneInfo(key)`` is called, the constructor first searches the
directories specified in :data:`TZPATH` for a file matching ``key``, and on
failure looks for a match in the tzdata package. This behavior can be
configured in three ways:

1. The default :data:`TZPATH` when not otherwise specified can be configured at
   :ref:`compile time <zoneinfo_data_compile_time_config>`.
2. :data:`TZPATH` can be configured using :ref:`an environment variable
   <zoneinfo_data_environment_var>`.
3. At :ref:`runtime <zoneinfo_data_runtime_config>`, the search path can be
   manipulated using the :func:`reset_tzpath` function.

.. _zoneinfo_data_compile_time_config:

Globals
-------

.. data:: TZPATH

    A read-only sequence representing the time zone search path -- when
    constructing a ``ZoneInfo`` from a key, the key is joined to each entry in
    the ``TZPATH``, and the first file found is used.

    ``TZPATH`` may contain only absolute paths, never relative paths,
    regardless of how it is configured.

    The object that ``zoneinfo.TZPATH`` points to may change in response to a
    call to :func:`reset_tzpath`, so it is recommended to use
    ``zoneinfo.TZPATH`` rather than importing ``TZPATH`` from ``zoneinfo`` or
    assigning a long-lived variable to ``zoneinfo.TZPATH``.

    For more information on configuring the time zone search path, see
    :ref:`zoneinfo_data_configuration`.
```


In `configure.ac`, we find the search path for zoneinfo binary files, `TZPATH`:

```m
TZPATH="/usr/share/zoneinfo:/usr/lib/zoneinfo:/usr/share/lib/zoneinfo:/etc/zoneinfo"
...
```

In `Lib/zoneinfo/_zoneinfo.py`, we can see that:
```python
from datetime import datetime, timedelta, tzinfo
...
class ZoneInfo(tzinfo):
...
```

In `Modules/_datetimemodule.c`, we find the PyDateTime_TZInfo implementation.. Line 3898:
```c
static PyTypeObject PyDateTime_TZInfoType = {
    PyVarObject_HEAD_INIT(NULL, 0)
    "datetime.tzinfo",
    ...
}
```

Now in `script.py`:

```python
import zoneinfo
import datetime
dt = datetime.datetime(2024, 3, 12, 0, 0, 0, 0)
z = zoneinfo.ZoneInfo("UTC")
z.utcoffset(dt)
```

Run `python -m trace --trace temp.py | grep -E 'modulename:|temp.py' | awk '/temp.py/ {printf "\033[0;31m%s\033[0m\n", $0; next} {print}'` to trace function calls with the lines in temp.py marked red for easy visual inspection.

Or simply `python -m trace --trace temp.py | awk '/temp.py/ {printf "\033[0;31m%s\033[0m\n", $0; next} {print}'` to see which specific lines of code are executed.

```shell
<frozen importlib._bootstrap>(199): <frozen importlib._bootstrap>(200): <frozen importlib._bootstrap>(204): <frozen importlib._bootstrap>(205): <frozen importlib._bootstrap>(207): temp.py(2): import datetime
temp.py(3): dt = datetime.datetime(2024, 3, 12, 0, 0, 0, 0)
temp.py(4): z = zoneinfo.ZoneInfo("UTC")
 --- modulename: weakref, funcname: get
 --- modulename: _tzpath, funcname: find_tzfile
 --- modulename: _tzpath, funcname: _validate_tzfile_path
 --- modulename: posixpath, funcname: isabs
 --- modulename: posixpath, funcname: _get_sep
 --- modulename: posixpath, funcname: normpath
 --- modulename: posixpath, funcname: join
 --- modulename: posixpath, funcname: _get_sep
 --- modulename: posixpath, funcname: normpath
 --- modulename: posixpath, funcname: join
 --- modulename: posixpath, funcname: _get_sep
 --- modulename: genericpath, funcname: isfile
 --- modulename: _common, funcname: load_data
 --- modulename: _common, funcname: from_file
 --- modulename: _common, funcname: __init__
 --- modulename: _common, funcname: from_file
 --- modulename: _common, funcname: __init__
 --- modulename: _common, funcname: <genexpr>
 --- modulename: _common, funcname: <genexpr>
 --- modulename: _common, funcname: <genexpr>
 --- modulename: _common, funcname: get_abbr
 --- modulename: _common, funcname: <genexpr>
 --- modulename: weakref, funcname: setdefault
 --- modulename: weakref, funcname: __new__
 --- modulename: weakref, funcname: __init__
temp.py(5): z.utcoffset(dt)
```

We can see the function call stack, but one problem is that python built-in methods are not shown here. For example, we are supposed to at least see utcoffset() in the call stack, while actually it is not present in the printed lines.

I circumvented this by making a custom copy of _zoneinfo.py:
```
Lib/zoneinfo/
├── _common.py
├── custom_zoneinfo.py (a copy of _zoneinfo.py)
├── __init__.py
├── __pycache__
├── _tzpath.py
└── _zoneinfo.py
```

and added some print statements in custom_zoneinfo.py for debugging, like this:
```python
class ZoneInfo(tzinfo):
    # ...
    def _load_file(self, fobj):
        # Retrieve all the data as it exists in the zoneinfo file
        print("----- _load_file start -----")
        print(fobj)
        trans_idx, trans_utc, utcoff, isdst, abbr, tz_str = _common.load_data(
            fobj
        )
        print("trans_idx", trans_idx)
        print("trans_utc", trans_utc)
        print("utcoff", utcoff)
        print("isdst", isdst)
        print("abbr", abbr)
        print("tz_str", tz_str)
        print("----- _load_file end -----")
    # ...
```

The file structure:
```
cpython
├── aclocal.m4
├── _bootstrap_python
├── build
├── config.guess
├── config.log
├── config.status
├── config.sub
├── configure
├── configure.ac
├── Doc
├── Dockerfile  (the dockerfile)
├── Grammar
├── Include
├── install-sh
├── iOS
├── Lib
├── libpython3.13d.a
├── LICENSE
├── Mac
├── Makefile
├── Makefile.pre
├── Makefile.pre.in
├── Misc
├── Modules
├── Objects
├── Parser
├── PC
├── PCbuild
├── platform
├── Programs
├── pybuilddir.txt
├── pyconfig.h
├── pyconfig.h.in
├── python
├── Python
├── python-config
├── python-config.py
├── python-gdb.py
├── README.rst
├── script.py   (the debug script)
└── Tools
```

Dockerfile:
note that even though `python:3.10-slim` is used as the base image, the script is executed by the customized python interpreter built inside the image.
```yaml
FROM python:3.10-slim
RUN cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
COPY . .

CMD ["sh", "-c", "./python script.py"]
```

script.py
```python
from zoneinfo.custom_zoneinfo import ZoneInfo
import datetime

dt = datetime.datetime(2024, 3, 12, 0, 0, 0, 0)
z1 = ZoneInfo("UTC")
z2 = ZoneInfo("Asia/Shanghai")

print("========== UTC ==========")
print(z1.utcoffset(dt))

print("===== Asia/Shanghai =====")
print(z2.utcoffset(dt))
```

Here is the output I get from building and running the docker container:
```
========== UTC ==========
>>> _load_file called from _new_instance() <<<
----- _load_file start -----
<_io.BufferedReader name='/usr/share/zoneinfo/UTC'>
trans_idx (2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2)
trans_utc (-2177481943, -1600675200, -1585904400, -933667200, -922093200, -908870400, -888829200, -881049600, -767869200, -745833600, -733827600, -716889600, -699613200, -683884800, -670669200, -652348800, -650019600, 515527200, 527014800, 545162400, 558464400, 577216800, 589914000, 608666400, 621968400, 640116000, 653418000, 671565600, 684867600)
utcoff (29143, 32400, 28800)
isdst (0, 1, 0)
abbr ('LMT', 'CDT', 'CST')
tz_str b'CST-8'
----- _load_file end -----
dstoff [0, 3600, 0]
trans_local [[-2177452800, -1600642800, -1585872000, -933634800, -922060800, -908838000, -888796800, -881017200, -767836800, -745801200, -733795200, -716857200, -699580800, -683852400, -670636800, -652316400, -649987200, 515559600, 527047200, 545194800, 558496800, 577249200, 589946400, 608698800, 622000800, 640148400, 653450400, 671598000, 684900000], [-2177453143, -1600646400, -1585875600, -933638400, -922064400, -908841600, -888800400, -881020800, -767840400, -745804800, -733798800, -716860800, -699584400, -683856000, -670640400, -652320000, -649990800, 515556000, 527043600, 545191200, 558493200, 577245600, 589942800, 608695200, 621997200, 640144800, 653446800, 671594400, 684896400]]
_ttinfo_list [_ttinfo(8:05:43, 0:00:00, LMT), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST)]
ts 1710201600
lt [-2177452800, -1600642800, -1585872000, -933634800, -922060800, -908838000, -888796800, -881017200, -767836800, -745801200, -733795200, -716857200, -699580800, -683852400, -670636800, -652316400, -649987200, 515559600, 527047200, 545194800, 558496800, 577249200, 589946400, 608698800, 622000800, 640148400, 653450400, 671598000, 684900000]
num_trans 29
tti_before _ttinfo(8:05:43, 0:00:00, LMT)
tti_before _ttinfo(8:00:00, 0:00:00, CST)
ttinfos [_ttinfo(8:00:00, 0:00:00, CST), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST)]
8:00:00
===== Asia/Shanghai =====
>>> _load_file called from _new_instance() <<<
----- _load_file start -----
<_io.BufferedReader name='/usr/share/zoneinfo/Asia/Shanghai'>
trans_idx (2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2)
trans_utc (-2177481943, -1600675200, -1585904400, -933667200, -922093200, -908870400, -888829200, -881049600, -767869200, -745833600, -733827600, -716889600, -699613200, -683884800, -670669200, -652348800, -650019600, 515527200, 527014800, 545162400, 558464400, 577216800, 589914000, 608666400, 621968400, 640116000, 653418000, 671565600, 684867600)
utcoff (29143, 32400, 28800)
isdst (0, 1, 0)
abbr ('LMT', 'CDT', 'CST')
tz_str b'CST-8'
----- _load_file end -----
dstoff [0, 3600, 0]
trans_local [[-2177452800, -1600642800, -1585872000, -933634800, -922060800, -908838000, -888796800, -881017200, -767836800, -745801200, -733795200, -716857200, -699580800, -683852400, -670636800, -652316400, -649987200, 515559600, 527047200, 545194800, 558496800, 577249200, 589946400, 608698800, 622000800, 640148400, 653450400, 671598000, 684900000], [-2177453143, -1600646400, -1585875600, -933638400, -922064400, -908841600, -888800400, -881020800, -767840400, -745804800, -733798800, -716860800, -699584400, -683856000, -670640400, -652320000, -649990800, 515556000, 527043600, 545191200, 558493200, 577245600, 589942800, 608695200, 621997200, 640144800, 653446800, 671594400, 684896400]]
_ttinfo_list [_ttinfo(8:05:43, 0:00:00, LMT), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST)]
ts 1710201600
lt [-2177452800, -1600642800, -1585872000, -933634800, -922060800, -908838000, -888796800, -881017200, -767836800, -745801200, -733795200, -716857200, -699580800, -683852400, -670636800, -652316400, -649987200, 515559600, 527047200, 545194800, 558496800, 577249200, 589946400, 608698800, 622000800, 640148400, 653450400, 671598000, 684900000]
num_trans 29
tti_before _ttinfo(8:05:43, 0:00:00, LMT)
tti_before _ttinfo(8:00:00, 0:00:00, CST)
ttinfos [_ttinfo(8:00:00, 0:00:00, CST), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST)]
8:00:00
```

compared to the output from running script.py from local terminal:
```
========== UTC ==========
>>> _load_file called from _new_instance() <<<
----- _load_file start -----
<_io.BufferedReader name='/usr/share/zoneinfo/UTC'>
trans_idx ()
trans_utc ()
utcoff (0,)
isdst (0,)
abbr ('UTC',)
tz_str b'UTC0'
----- _load_file end -----
dstoff [0]
trans_local [[], []]
_ttinfo_list [_ttinfo(0:00:00, 0:00:00, UTC)]
ts 1710201600
lt []
num_trans 0
tti_before _ttinfo(0:00:00, 0:00:00, UTC)
tti_before _ttinfo(0:00:00, 0:00:00, UTC)
ttinfos []
0:00:00
===== Asia/Shanghai =====
>>> _load_file called from _new_instance() <<<
----- _load_file start -----
<_io.BufferedReader name='/usr/share/zoneinfo/Asia/Shanghai'>
trans_idx (2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2)
trans_utc (-2177481943, -1600675200, -1585904400, -933667200, -922093200, -908870400, -888829200, -881049600, -767869200, -745833600, -733827600, -716889600, -699613200, -683884800, -670669200, -652348800, -650019600, 515527200, 527014800, 545162400, 558464400, 577216800, 589914000, 608666400, 621968400, 640116000, 653418000, 671565600, 684867600)
utcoff (29143, 32400, 28800)
isdst (0, 1, 0)
abbr ('LMT', 'CDT', 'CST')
tz_str b'CST-8'
----- _load_file end -----
dstoff [0, 3600, 0]
trans_local [[-2177452800, -1600642800, -1585872000, -933634800, -922060800, -908838000, -888796800, -881017200, -767836800, -745801200, -733795200, -716857200, -699580800, -683852400, -670636800, -652316400, -649987200, 515559600, 527047200, 545194800, 558496800, 577249200, 589946400, 608698800, 622000800, 640148400, 653450400, 671598000, 684900000], [-2177453143, -1600646400, -1585875600, -933638400, -922064400, -908841600, -888800400, -881020800, -767840400, -745804800, -733798800, -716860800, -699584400, -683856000, -670640400, -652320000, -649990800, 515556000, 527043600, 545191200, 558493200, 577245600, 589942800, 608695200, 621997200, 640144800, 653446800, 671594400, 684896400]]
_ttinfo_list [_ttinfo(8:05:43, 0:00:00, LMT), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST)]
ts 1710201600
lt [-2177452800, -1600642800, -1585872000, -933634800, -922060800, -908838000, -888796800, -881017200, -767836800, -745801200, -733795200, -716857200, -699580800, -683852400, -670636800, -652316400, -649987200, 515559600, 527047200, 545194800, 558496800, 577249200, 589946400, 608698800, 622000800, 640148400, 653450400, 671598000, 684900000]
num_trans 29
tti_before _ttinfo(8:05:43, 0:00:00, LMT)
tti_before _ttinfo(8:00:00, 0:00:00, CST)
ttinfos [_ttinfo(8:00:00, 0:00:00, CST), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST), _ttinfo(9:00:00, 1:00:00, CDT), _ttinfo(8:00:00, 0:00:00, CST)]
8:00:00
```

We can see that loading /usr/share/zoneinfo/UTC gave different results in the docker container compared to local terminal. This is really weird. 
/usr/share/zoneinfo/UTC is part of the time zone database on Unix-like operating systems, thus it should be the same for both the docker container and my linux machine. I went ahead to compare the binary files:

```shell
# comp.sh
echo "$1"
echo "$2"
if diff "$1" "$2" >/dev/null; then
    echo "same"
else
    echo "differ"
fi
```

On local terminal, they are different, which is expected:
```shell
/usr/share/zoneinfo/Asia/Shanghai
/usr/share/zoneinfo/UTC
differ
```

```Dockerfile
FROM python:3.10-slim
RUN cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime

COPY . .
CMD ["sh", "-c", "./comp.sh /usr/share/zoneinfo/Asia/Shanghai /usr/share/zoneinfo/UTC"]
```

And the output confirmed that these two files are the same!

```shell
/usr/share/zoneinfo/Asia/Shanghai
/usr/share/zoneinfo/UTC
same
```

So now, I finally identified what is causing the problem. But why would these two files be the same in the docker container?

# Experiment
We have three set of files:
- **Actual zoneinfo**: timezone binary files containing info corresponding to each time zone. I got these standard files from my local Linux system and built them into the Docker image for reference.
- **Container zoneinfo**: timezone binary files stored in `/usr/share/zoneinfo` in the container.
- **System localtime**: /etc/localtime, the binary file used for system timezone configuration in the container.

Three time zones are involved in this experiment: an unrelated timezone (Toronto) as a blank control, the timezone Shanghai corresponding to the copied file, and the affected timezone UTC which seems to have gone wrong.

In the control group, we have `Dockerfile_nocp`:

```
FROM python:3.10-slim

COPY . .
CMD ["sh", "-c", "\
cat /etc/timezone && \
./comp.sh /usr/share/zoneinfo/America/Toronto ./referenceToronto && \
./comp.sh /usr/share/zoneinfo/Asia/Shanghai ./referenceShanghai && \
./comp.sh /usr/share/zoneinfo/UTC ./referenceShanghai && \
./comp.sh /usr/share/zoneinfo/UTC ./referenceUTC && \
./comp.sh /usr/share/zoneinfo/UTC ./referenceToronto && \
./comp.sh /etc/localtime ./referenceShanghai && \
./comp.sh /etc/localtime ./referenceUTC && \
./comp.sh /etc/localtime ./referenceToronto"]
```

Build and run:
```
docker build -f Dockerfile_nocp -t control .
docker run control
```

Output:
```
Etc/UTC
/usr/share/zoneinfo/America/Toronto
./referenceToronto
same                                    // Toronto zoneinfo: Unaffected (expected)
/usr/share/zoneinfo/Asia/Shanghai
./referenceShanghai
same                                    // Shanghai zoneinfo: Unaffected (expected)
/usr/share/zoneinfo/UTC
./referenceShanghai
differ                                  
/usr/share/zoneinfo/UTC
./referenceUTC
same                                    // UTC zoneinfo: Unaffected (expected)
/usr/share/zoneinfo/UTC
./referenceToronto
differ
/etc/localtime
./referenceShanghai
differ
/etc/localtime
./referenceUTC
same                   // system config now uses the correct UTC binary file (expected)
/etc/localtime
./referenceToronto
differ
```

In `Dockerfile_cp`:
```
FROM python:3.10-slim
RUN cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime

COPY . .
CMD ["sh", "-c", "\
cat /etc/timezone && \
./comp.sh /usr/share/zoneinfo/America/Toronto ./referenceToronto && \
./comp.sh /usr/share/zoneinfo/Asia/Shanghai ./referenceShanghai && \
./comp.sh /usr/share/zoneinfo/UTC ./referenceShanghai && \
./comp.sh /usr/share/zoneinfo/UTC ./referenceUTC && \
./comp.sh /usr/share/zoneinfo/UTC ./referenceToronto && \
./comp.sh /etc/localtime ./referenceShanghai && \
./comp.sh /etc/localtime ./referenceUTC && \
./comp.sh /etc/localtime ./referenceToronto"]
```

Build and run, output:
```
Etc/UTC
/usr/share/zoneinfo/America/Toronto
./referenceToronto
same                                    // Toronto zoneinfo: Unaffected (expected)
/usr/share/zoneinfo/Asia/Shanghai
./referenceShanghai
same                                    // Shanghai zoneinfo: Unaffected (expected)
/usr/share/zoneinfo/UTC
./referenceShanghai
same                 // UTC zoneinfo: now actually becomes the Shanghai binary file (wrong)
/usr/share/zoneinfo/UTC
./referenceUTC
differ
/usr/share/zoneinfo/UTC
./referenceToronto
differ
/etc/localtime
./referenceShanghai
same                 // system config now uses the correct Shanghai binary file (expected)
/etc/localtime
./referenceUTC
differ
/etc/localtime
./referenceToronto
differ
```

# Conclusion

After copying, /etc/localtime becomes the Shanghai standard binary file, but /usr/share/zoneinfo/UTC gets changes to the Shanghai binary file too, as a side effect, which caused the issue of wrong utcoffset.