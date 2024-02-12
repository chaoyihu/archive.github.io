---
layout: post
title: "Build a C Extension for Python using Python API on Linux"
date: 2024-01-21
tags: [Python, C/C++]
categories: [developer]
description: "Explaining how I followed Python's Doc to build a Python C extension using Python API, which can be imported as a library to run shell commands in Python scripts."
github_repo_name: "python_x_cpp"
---

[![{{ site.github_username }} - {{ page.github_repo_name }}](https://img.shields.io/static/v1?label={{ site.github_username }}&message={{ page.github_repo_name }}&color=blue&logo=github)](https://github.com/{{ site.github_username }}/{{ page.github_repo_name }})

In this post, I am explaining how I followed [Python's Documentation](https://docs.python.org/3/extending/extending.html) to build a C++ extension that can be imported as a Python module for system-level access. Completing this little project allowed me to establish a viable workflow for extending Python with C/C++, and I also ended up producing a nice little tool that provides system-level access in Python scripts.

My post can serve as a quick introduction, providing the essential steps and problem-solving tips. If you're interested, I strongly recommend you to explore the documentation on your own for a more comprehensive understanding.

Source code is available [here](https://github.com/chaoyihu/python_x_cpp).
My main reference is [Python/C API Reference Manual](https://docs.python.org/3/c-api/): Detailed documentation for Python API functions.

# Why Extending Python with C

If you are like me - a user of data-intensive Python libraries such as [NumPy](https://github.com/numpy/numpy), [PyTorch](https://github.com/pytorch/pytorch), and [Pandas](https://github.com/pandas-dev/pandas), you probably have noticed that these libraries all sit on top substantial C/C++ codebases. This practice of combining Python with C/C++ is very popular among developers, as it provides advantages in several aspects, such as:

- **Performance:** Though Python's speed can depend on the context and specific use cases, it is often perceived as slower due to factors such as dynamic typing overhead and its interpreted nature. Therefore, developers may choose C/C++ for tasks that are performance-critical.

- **Parallel Computing:** Python's main implementation, CPython, has a [GIL](https://wiki.python.org/moin/GlobalInterpreterLock) limiting its performance in multithreaded scenarios (this statement may be subject to change, see <a href="#notes-on-parallel-execution-in-python">discussion here</a>), while C++ provides powerful features for parallel computing.

- **Low-level System Access:** C++ modules are effective in accessing system-level or hardware-level features, making it important for industries like embedded systems development.

- **Combined Advantages of Ecosystems:** This can be demonstrated by an example. Initially developed in C++, [OpenCV](https://github.com/opencv) is a computer vision library highly optimized for real-time applications. Later, [opencv-python](https://github.com/opencv/opencv-python) was created as a wrapper module, exposing an API easily accessible from Python and seamless integrating OpenCV into Python pipelines. It has since become tremendously popular for rapid prototyping of computer vision applications. By combining C++ with Python, developers achieved a balance between performance and ease of development, maximally utilizing strengths of both languages.


# Building a C Extension for Python Using Python API: Step-by-Step

## Goal

The goal is to be able to import the extension as a module in Python, pass shell commands as a string parameter, and retrieve the execution output:
```python
>>> import mycli
>>> mycli.system("free")
               total        used        free      shared  buff/cache   available
Mem:         7486192     2958584     1086096      200060     3441512     4025260
Swap:        2097148           0     2097148
0
```

## Step 0: Development Environment

Here is what I am working with:
```
- Python 3.10.12
- gcc (Ubuntu 11.4.0-1ubuntu1~22.04) 11.4.0
- Ubuntu 22.04.3 LTS
```
> ***Please note!***
>
> Building Python C extension using Python API is specific to CPython. If you are developing with alternative Python implementations, please see [this discussion](#alternative-solutions-extending-python-using-third-party-tools).

## Step 1: Create the C Source File

Ref: [Python's Documentation](https://docs.python.org/3/extending/extending.html).

Make a new folder for your project, and in the folder, create your c source file named `myclimodule.c`. You can use the Python API by adding these two lines to the beginning of your C source file:

```cpp
#define PY_SSIZE_T_CLEAN
// Pulls in the python api. Must be included before 
// any standard headers, as it may have pre-processor 
// definitions affecting standard headers.
#include <Python.h>   
```

> ***Understanding the code***
>
> **Notation explanation**: All user-visible symbols defined by Python.h have a prefix of Py or PY, except those defined in standard header files. The full, detailed documentation can be viewed [here](ttps://docs.python.org/3/c-api/).
>
> **What is PY_SSIZE_T_CLEAN:** According to [ferdnyc's post](https://github.com/python/cpython/issues/102102), the macro PY_SSIZE_T_CLEAN must be defined before the header to ensure backward compatibility in Python's argument parsing functions.
>
> **What does Python.h include:** *Python.h* defines a set of functions, macros and variables that provide access to most aspects of the Python run-time system. A few commonly used standard header files, *stdio.h*, *string.h*, *errno.h*, and *stdlib.h*, are already included.

Then, we can proceed to write a function that performs the main function - taking shell command as input, executes it, and retrieve the result with exit status. Code as follows:

```cpp
/* A C function designed to be used as a Python C extension, 
 * providing a way to execute shell commands and retrieve 
 * their exit status in a Python script. The command to be 
 * executed is passed as a string argument to the function, 
 * and the exit status is returned as a Python integer. */
static PyObject *
mycli_system(PyObject *self, PyObject *args)
{
    const char *command;
    int sts;

    if (!PyArg_ParseTuple(args, "s", &command))
        return NULL;
    sts = system(command);   // executes the command and stores the return value
    return PyLong_FromLong(sts);
}
```

> ***Understanding the code***
> 
> ***static PyObject *spam_system(PyObject *self, PyObject *args)*:** This line declares a C function named mycli_system that takes two parameters: self and args. The self parameter is a reference to the instance of the extension module (but it's not used in this function). The args parameter is a tuple of arguments passed to the function.
>
> **Return NULL for error handling:** Refer to [this](https://docs.python.org/3/extending/extending.html#intermezzo-errors-and-exceptions) for more details.


Next, we need to declare a method, and make it point to this function we just implemented:

```cpp
/* The Method Table*/
static PyMethodDef SpamMethods[] = { 
    // ...
    {   
        "system",                   /* Name of method*/
        mycli_system,                /* Pointer to the C implementation*/
        METH_VARARGS,               /* Flags bits indicating how the call
                                       should be constructed*/
        "Execute a shell command."  /* Points to the contents of the docstring*/
    },  
    // ...
    {NULL, NULL, 0, NULL}           /* sentinel */
};
```
> ***Understanding the code***
> 
> [*PyMethodDef*](https://docs.python.org/3/c-api/structures.html#c.PyMethodDef) is simply a structure used to describe a method of an extension type.

Now we proceed to define the module. The method table we just defined should be referenced in te module definition. Other comments are pretty self-explanatory.

```cpp
/* The Module Definition*/
static struct PyModuleDef
myclimodule = { 
    PyModuleDef_HEAD_INIT,
    "mycli",     /* Name of module */
    NULL,        /* module doc, may be null */
    -1,          /* Size of per-interpreter state of the module
                    or -1 if the module keeps state in global vars*/
    SpamMethods  /* The method table must be referenced in 
                    the module definition*/
};
```

With the module definition available, we still need to be able to initialize it. So here is the initialization function - the only one so far that is not static:

```cpp
/* The Module's Initialization Function*/
/* Must be named PyInit_name */
PyMODINIT_FUNC
PyInit_mycli(void) {
    return PyModule_Create(&myclimodule);
}
```

By here, we are actually done with the extension, since this initialization function acts as the entry point to our Python C extension. When we run "import mycli" in a Python script, the Python interpreter will look for, and invoke the *PyInit_mycli* function, which returns a pointer to a new module object given the module definition.

In Python's doc, there is a main function in the example module, which is not directly related to the behavior of the extension when imported in Python. It is responsible for initializing the Python interpreter, setting up configurations, and adding the extension module to the list of built-in modules. It serves specifically as the entry point if you want to compile your C code to a standalone executable.

Just to inspect the output and understand what it does, you can add the main function here to your C source file, then use the attached commands to compile and run.

```cpp
/* Not directly relevant to Python C Extension. Only as entry point if you
   compile this C source as standalone executable. */
int
main(int argc, char *argv[])
{
    wchar_t *program = Py_DecodeLocale(argv[0], NULL);
    if (program == NULL) {
        fprintf(stderr, "Fatal error: cannot decode argv[0]\n");
        exit(1);
    }

    /* Add a built-in module, before Py_Initialize */
    if (PyImport_AppendInittab("mycli", PyInit_mycli) == -1) {
        fprintf(stderr, "Error: could not extend in-built modules table\n");
        exit(1);
    }

    /* Pass argv[0] to the Python interpreter */
    Py_SetProgramName(program);

    /* Initialize the Python interpreter.  Required.
       If this step fails, it will be a fatal error. */
    Py_Initialize();

    /* Optionally import the module; alternatively,
       import can be deferred until the embedded script
       imports it. */
    PyObject *pmodule = PyImport_ImportModule("mycli");
    if (!pmodule) {
        PyErr_Print();
        fprintf(stderr, "Error: could not import module 'spam'\n");
    }

    // Get a reference to the "system" function from the module
    PyObject *pfunction = PyObject_GetAttrString(pmodule, "system");

    // Call the "system" function with the argument "free"
    PyObject *pargs = PyTuple_Pack(1, PyUnicode_DecodeFSDefault("free"));

    // Retrieve and display the results
    PyObject *presult = PyObject_CallObject(pfunction, pargs);
    if (!presult) {
        PyErr_Print();
        fprintf(stderr, "Error: calling 'system' function failed\n");
    } else {
        printf("Result: %ld\n", PyLong_AsLong(presult));
    }

    PyMem_RawFree(program);
    return 0;
}
```

```shell
$ gcc -o build/mycli_standalone myclimodule.c -I /usr/include/python3.10/ -lpython3.10
$ ./build/mycli_standalone
```
Output (same as what you'll get when executing the "free" command from terminal):
```
               total        used        free      shared  buff/cache   available
Mem:         7486192     4126828     1600080      102772     1759284     2954320
Swap:        2097148      888576     1208572
Result: 0
```

> ***NOTES***
> 
> The main function does not need to be in *myclimodule.c* when compiling the extension in the next step.

## Step 2: Compiling the C Source File and Linking to Python

In this step, we will compile the C extension and make it available for dynamic loading in Python.

### Method 1: Using setuptools

The [setuptools documentation](https://setuptools.pypa.io/en/latest/userguide/ext_modules.html) provides guide on how to build C/C++ extensions.

I made a new directory called *packagemycli/* and structured it like this:
```shell
packagemycli
├── myclimodule.c
├── pyproject.toml
└── setup.py
```

In *pyproject.toml*:
```
[build-system]
requires = ["setuptools"]
build-backend = "setuptools.build_meta"

[project]
name="mycli"
version="1.0.0"
```

In *setup.py*:
```python
from setuptools import Extension, setup

setup(
    ext_modules=[
        Extension(
            name="mycli",  # as it would be imported
                           # may include packages/namespaces separated by `.`
            sources=["myclimodule.c"], # all sources are compiled into a single binary file
        ),
    ]
)
```
If you do not have *build* installed, run:
```shell
$ pip install --upgrade build
```
Now build your distribution using:
```shell
$ python -m build
```
Hooray! Now your file structure look like this:
```shell
packagemycli
├── dist
│   ├── mycli-1.0.0-cp310-cp310-linux_x86_64.whl
│   └── mycli-1.0.0.tar.gz
├── mycli.egg-info
│   ├── dependency_links.txt
│   ├── PKG-INFO
│   ├── SOURCES.txt
│   └── top_level.txt
├── myclimodule.c
├── pyproject.toml
└── setup.py
```

Install your distribution, and you can import and use it in Python scripts:
```shell
$ pip install dist/mycli-1.0.0-cp310-cp310-linux_x86_64.whl
```
```python
>>> import mycli
>>> mycli.system("echo hello")
hello
0
```

### Method 2: Using gcc

Instead of using setuptools, I simply compiled it as a .so file using gcc and linked it to Python. Running the following commands worked fine for me:
```shell
$ sudo apt install python-dev-is-python3
$ export PYTHONPATH=./build:$PYTHONPATH
$ export CPATH=<path to python include>:$CPATH
$ gcc -fPIC --shared -o build/mycli.so myclimodule.c
```

> ***NOTES***
>
> - Path to python include can be found using:
> ```python
> >>> from sysconfig import get_paths
> >>> info = get_paths()
> >>> print(info["include"])
> /usr/include/python3.10
> ```
> - The .so filename should be the same as the module name used for import.
>
> - You can also run `gcc -fPIC --shared -o build/mycli_standalone.so myclimodule.c -I /usr/include/python3.10/`, specifying the directory where Python header files are located without adding the python include directory to $CPATH.

Here is how I arrived at it. First, I tried compiling using a quite straightforward command but failed:
```shell
$ gcc --shared -o build/myclimodule.so myclimodule.c 
myclimodule.c:6:10: fatal error: Python.h: No such file or directory
    6 | #include <Python.h>
      |          ^~~~~~~~~~
compilation terminated.
```

Referring to [this post](https://stackoverflow.com/questions/21530577/fatal-error-python-h-no-such-file-or-directory), I installed python dev and tried again, but the problem persists. C still cannot find the Python extension header. So I located *Python.h* and manually added it to CPATH. Now I get a different error:
```shell
$ sudo apt install python-dev-is-python3
$ gcc --shared -o build/myclimodule.so myclimodule.c 
myclimodule.c:6:10: fatal error: Python.h: No such file or directory
    6 | #include <Python.h>
      |          ^~~~~~~~~~
$ export CPATH=/usr/include/python3.10/:$CPATH
$ gcc --shared -o build/myclimodule.so myclimodule.c 
/usr/bin/ld: /tmp/ccbB6QA9.o: warning: relocation against `PyInit_mycli' in read-only section `.text'
/usr/bin/ld: /tmp/ccbB6QA9.o: relocation R_X86_64_PC32 against symbol `stderr@@GLIBC_2.2.5' can not be used when making a shared object; recompile with -fPIC
/usr/bin/ld: final link failed: bad value
collect2: error: ld returned 1 exit status
```

The error messages explicitly tells me to recompile using *-fPIC*. So I compiled again with this option. This time the compilation completed, but when I went ahead to import the module in Python, Python cannot find the module:
```shell
$ gcc -fPIC --shared -o build/myclimodule.so myclimodule.c
```
```python
>>> import mycli
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
ModuleNotFoundError: No module named 'mycli'
```

Two important tips from the [doc](https://docs.python.org/3/extending/building.html#building): First, the shared library must be available on PYTHONPATH to be importable. Second, make sure to name the .so file the same way used for import. So I added the build path to PYTHONPATH, and compiled the file again to *mycli.so* instead of *myclimodule.so*:
```shell
$ export PYTHONPATH=./build:$PYTHONPATH
$ echo $PYTHONPATH
./build:
$ gcc -fPIC --shared -o build/mycli.so myclimodule.c
```

It worked!
```python
>>> import mycli
>>> mycli.system("ls -a")
.  ..  build  .git  main.py  myclimodule.c  README.md
0
```


# Discussions

## Other Solutions: Extending Python using Third-party Tools

Other solutions are available to extend Python with C. Listed below are a few of them provided in [doc](https://docs.python.org/3/extending/index.html).

[ctypes](https://docs.python.org/3/library/ctypes.html#module-ctypes) and [cffi](https://cffi.readthedocs.io/en/stable/) are foreign function libraries you can use in cases of calling C library functions or making system calls.


[Cython](https://cython.org/) is a programming language that makes it easy to write C extensions for Python. Cython code looks similar to Python, but it includes additional syntax that allow for C-like features. Here is a minimum example:

```python
# example.pyx
# This is some Cython code
def square(int x):
    return x * x
```

```python
# main.py
import example
print(example.square(3))
```

```python
# setup.py
from setuptools import setup
from Cython.Build import cythonize

setup(
    ext_modules=cythonize("example.pyx"),
)
```

```shell
# compile.sh
python setup.py build_ext --inplace
```

Build and run:
```shell
$ source compile.sh
$ python main.py 
9
```

[SWIG](https://www.swig.org/) is an interface compiler that connects programs written in C and C++ with scripting languages such as Perl, Python, Ruby, and Tcl.

[Numba](https://numba.pydata.org/) is a Just-in-time compiler that translates a subset of Python and NumPy code into fast machine code. No separate compilation is needed - it can be as simple as importing Numba as a library and applying decorators to your Python functions.

A few useful posts I came across such as  [Python Bindings: Calling C or C++ From Python - Real Python](https://realpython.com/python-bindings-overview/#other-solutions) and [Create a C++ extension for Python - Microsoft Learn](https://learn.microsoft.com/en-us/visualstudio/python/working-with-c-cpp-python-in-visual-studio?view=vs-2022) introduced some other ways to create Python bindings, including PyBind, SIP, PyBindgen, etc.

Plus, if you are interested, the [Python Packaging User Guide: Binary Extensions](https://packaging.python.org/en/latest/guides/packaging-binary-extensions/) covers several available tools that simplify the creation of binary extensions.

## Notes on parallel execution in Python

- **The multiprocessing Python library:** While the [multiprocessing](https://docs.python.org/3/library/multiprocessing.html) library is a valuable tool for achieving parallelism in Python, it's worth noting that using it comes with some overhead, as processes need to be created and communication between them involves serialization and deserialization of data. In contrast, C++ provides native support for multithreading and parallelism through features like threads, mutexes, and parallel algorithms in the Standard Template Library (STL). This allows for more fine-grained control over shared data and can be more lightweight.

- **The no-GIL Python:** In July 2023, the Python team [officially accepted](https://discuss.python.org/t/a-steering-council-notice-about-pep-703-making-the-global-interpreter-lock-optional-in-cpython/30474) the proposal of making the GIL optional in CPython. [Proof of Concept](https://github.com/colesbury/nogil) for no-GIL Python has also been made available. However, the team will only commit to switching entirely to the no-GIL build when they are confident that there is community support to make production use of no-GIL viable. Besides, having no-GIL build as the default will take time.

## Cross-platform development

C++ is often used for writing platform-specific code, especially when developing cross-platform applications. Python libraries that rely on C++ codebases usually release builds for different platforms, see [numpy's release page](https://pypi.org/project/numpy/#files) for example.

If you are interested, there are discussions like [this one](https://stackoverflow.com/questions/64261360/how-are-pythons-c-and-c-libraries-cross-platform) and [this one](https://stackoverflow.com/questions/8721918/how-do-you-compile-python-c-c-extensions-for-different-os-versions-of-python) explaining how developers compile their code for multiple platforms.


# Summary

To summarize, this post:

- Explained the motivations for extending Python with C.
- Went through my steps of building a Python C extension using Python API, from creating the C source file to compiling it using setuptools and gcc respectively, resulting in a custom C extension dynamically loaded to Python for shell command execution.
- Included a brief discussion on alternative solutions you can use to extend Python with C.
- Attached notes to expand on some topics mentioned in the post.

Thanks for reading! I would be delighted if you found this post useful or interesting. See you in the next one (^_^)/
