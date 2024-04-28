---
layout: post
title: "Fast Fibonacci"
date: 2024-04-02
tags: [Math, Algorithm]
categories: [developer]
description: "Random topic: How to calculate the Nth fibonacci number in O(logN) time?"
github_repo_name: "misc/fast_fibonacci"
---

# Define the problem

Here is the fibonacci sequence:

$$ 0, 1, 1, 2, 3, 5, 8, ... $$

We can describe it using this recurrence relation:

$$\\
\begin{align}

&f(0) = 0, f(1) = 1, \\
&f(n) = f(n-1) + f(n-2), \forall n > 1.

\end{align}
\\$$

How do we calculate \\(f(n)\\)?

# Lazy solution

There is an obvious way of calculating using straight-forward equation substitution until all terms are represented as linear combinations of \\(f(0)\\) and \\(f(1)\\) - which we already know:

$$\\
\begin{align}

f(n)
& = \color{green}{f(n-1)} 
    \color{black}{+} 
    \color{blue}{f(n-2)} 
    \\
& = \color{yellowgreen}{f(n-2)} \color{black}{+} \color{darkgreen}{f(n-3)}
    \color{black}{+} 
    \color{royalblue}{f(n-3)} \color{black}{+} \color{darkblue}{f(n-4)} 
    \\
& = \color{yellowgreen}{f(n-3) + f(n-4)} \color{black}{+} \color{darkgreen}{f(n-4) + f(n-5)}
    \color{black}{+} 
    \color{royalblue}{f(n-4) + f(n-5)} \color{black}{+} \color{darkblue}{f(n-5) + f(n-6)}
    \\
& = ... \\
& = k_1 \color{purple}{f(1)} \color{black}{+} k_2 \color{purple}{f(0)} \color{black}{, k1, k2 \in \mathbb{Z}.}
\end{align}
\\$$

Following is an implementation of this solution in Python:

```python
def fib_lazy(n):
    if n == 0 or n == 1:
        return n
    return fib_lazy(n - 1) + fib_lazy(n - 2)
```

Let's run the code on some tests:
```shell
n = 0, fibonacci - lazy
Result: 0, Time: 0:00:00.000041
n = 1, fibonacci - lazy
Result: 1, Time: 0:00:00.000009
n = 2, fibonacci - lazy
Result: 1, Time: 0:00:00.000008
n = 3, fibonacci - lazy
Result: 2, Time: 0:00:00.000010
n = 4, fibonacci - lazy
Result: 3, Time: 0:00:00.000008
n = 5, fibonacci - lazy
Result: 5, Time: 0:00:00.000013
n = 10, fibonacci - lazy
Result: 55, Time: 0:00:00.000049
n = 20, fibonacci - lazy
Result: 6765, Time: 0:00:00.004293
n = 30, fibonacci - lazy
Result: 832040, Time: 0:00:00.213054
n = 40, fibonacci - lazy
Result: 102334155, Time: 0:00:23.681138
```

Note that calculating \\(f(40)\\) took more than 20 seconds. This is because the lazy solution has a very bad time complexity. See the tree structure below:

```shell
layer 0                                 f(n)
layer 1               f(n-1)                             f(n-2)
layer 2      f(n-2)           f(n-3)             f(n-3)           f(n-4)
layer 3  f(n-3)  f(n-4)    f(n-4)  f(n-5)    f(n-4)  f(n-5)    f(n-5)  f(n-6)
...         ...   ...       ...    ...         ...    ...       ...     ...
```

On layer n, \\(f(n)\\) will finally be completely substituted by f(0) and f(1). For each call to function f, the calculation branches with a factor of 2, so from layer 0 to layer n, the number of calls should be approximately:

$$ 2^0 + 2^1 + 2^2 + ... + 2^n = 2^{n+1} - 1$$

Therefore we know the time complexity for this solution is \\(O(2^n)\\). The space complexity is \\(O(2^n)\\) too, as we need to maintain the function call stack.


# Linear time solution

Now we notice redundancy in the previous solution: some values get calculated repeatedly. For example, \\(f(n-2)\\) is called and calculated both from \\(f(n)\\) and \\(f(n-1)\\):
```shell
layer 0                                 f(n)
layer 1               f(n-1)                           f(n-2)
                                                        ^^^^
layer 2     f(n-2)            f(n-3)            f(n-3)           f(n-4)
             ^^^^
layer 3  f(n-3)  f(n-4)    f(n-4)  f(n-5)   f(n-4)  f(n-5)    f(n-5)  f(n-6)
...         ...   ...       ...    ...         ...    ...       ...     ...
```
```python
memo = {0: 0, 1: 1}
def fib_memo(n):
    if n in memo:
        return memo[n]
    res = fib_memo(n - 1) + fib_memo(n - 2)
    memo[n] = res
    return res
```

We can totally memorize calculated values to avoid redoing the calculation, and it is a lot faster:

```shell
n = 0, fibonacci - memo
Result:  0
Time:  0:00:00.000041
n = 1, fibonacci - memo
Result:  1
Time:  0:00:00.000007
n = 2, fibonacci - memo
Result:  1
Time:  0:00:00.000008
n = 3, fibonacci - memo
Result:  2
Time:  0:00:00.000009
n = 4, fibonacci - memo
Result:  3
Time:  0:00:00.000006
n = 5, fibonacci - memo
Result:  5
Time:  0:00:00.000009
n = 10, fibonacci - memo
Result:  55
Time:  0:00:00.000014
n = 20, fibonacci - memo
Result:  6765
Time:  0:00:00.000015
n = 30, fibonacci - memo
Result:  832040
Time:  0:00:00.000016
n = 40, fibonacci - memo
Result:  102334155
Time:  0:00:00.000014
```

But if we increase n, we are going to get a recursion error:

```shell
n = 40, fibonacci - memo
Result:  102334155
Time:  0:00:00.000081
n = 60, fibonacci - memo
Result:  1548008755920
Time:  0:00:00.000024
n = 80, fibonacci - memo
Result:  23416728348467685
Time:  0:00:00.000020
n = 2000, fibonacci - memo
Traceback (most recent call last):
  File "/home/chaoyi/misc/fast_fibonacci/fibonacci.py", line 53, in <module>
    res = fib_memo(n)
  File "/home/chaoyi/misc/fast_fibonacci/fibonacci.py", line 12, in fib_memo
    res = fib_memo(n - 1) + fib_memo(n - 2)
  File "/home/chaoyi/misc/fast_fibonacci/fibonacci.py", line 12, in fib_memo
    res = fib_memo(n - 1) + fib_memo(n - 2)
  File "/home/chaoyi/misc/fast_fibonacci/fibonacci.py", line 12, in fib_memo
    res = fib_memo(n - 1) + fib_memo(n - 2)
  [Previous line repeated 996 more times]
RecursionError: maximum recursion depth exceeded
```

To avoid this problem, we can do the calculation from the other direction. Plus, we can save some memory by only keeping the closest two values in memory:

$$\\
\begin{align}
&f(0) = 0, f(1) = 1 \\
&f(2) = f(1) + f(0) = 1, f(0) \text{ no longer needed thus delete}\\
&f(3) = f(2) + f(1) = 2, f(1) \text{ no longer needed thus delete}\\
&... \\
&f(k) = f(k-1) + f(k-2), f(k-2) \text{ no longer needed thus delete}\\
&... \\
&f(n) = f(n-1) + f(n-2), \text{final answer}\\

\end{align}
\\$$

```python
# Linear time, constant space
def fib_memo_2(n):
    if n == 0 or n == 1:
        return n
    km1, km2 = 1, 0
    for k in range(2, n + 1):
        res = km1 + km2
        km1, km2 = res, km1
    return res
```

Now run again:

```shell
n = 40, fibonacci - memo
Result:  102334155
Time:  0:00:00.000051
n = 60, fibonacci - memo
Result:  1548008755920
Time:  0:00:00.000017
n = 80, fibonacci - memo
Result:  23416728348467685
Time:  0:00:00.000015
n = 2000, fibonacci - memo
Result:  4224696333392304878706725602341482782579852840250681098010280137314308584370130707224123599639141511088446087538909603607640194711643596029271983312598737326253555802606991585915229492453904998722256795316982874482472992263901833716778060607011615497886719879858311468870876264597369086722884023654422295243347964480139515349562972087652656069529806499841977448720155612802665404554171717881930324025204312082516817125
Time:  0:00:00.000316
```

# O(logn) time solution

In fact, it is possible to calculate \\(f(n)\\) in \\(O(logn)\\) time. We just need to represent the recurrence relation in a different way.

The recurrence relation:

$$\\
f(n) = f(n-1) + f(n-2) \\
\\$$

is the same as:

$$\\
\begin{align}
&\color{blue}{f(n)} &= \color{blue}{1} \color{black}{\cdot f(n-1) +} \color{blue}{1} \color{black}{\cdot f(n-2)} \\
&\color{green}{f(n - 1)} &= \color{green}{1} \color{black}{\cdot f(n-1) +} \color{green}{0} \color{black}{\cdot f(n-2)}
\end{align}
\\$$

thus can be written in matrix form as:

$$\\

\begin{bmatrix}
\color{blue}{f(n)} \\
\color{green}{f(n - 1)}
\end{bmatrix}
=
\begin{bmatrix}
\color{blue}{1} & \color{blue}{1} \\
\color{green}{1} & \color{green}{0}
\end{bmatrix}
\begin{bmatrix}
f(n - 1) \\
f(n - 2)
\end{bmatrix}

\\$$

And we can use substitution on this formula until it's represented with \\(f(1)\\) and \\(f(0)\\) only:

$$\\

\begin{bmatrix}
f(n) \\
f(n - 1)
\end{bmatrix}
=
\begin{bmatrix}
1 & 1 \\
1 & 0
\end{bmatrix}
\begin{bmatrix}
f(n - 1) \\
f(n - 2)
\end{bmatrix}
=
\begin{bmatrix}
1 & 1 \\
1 & 0
\end{bmatrix}
\begin{bmatrix}
1 & 1 \\
1 & 0
\end{bmatrix}
\begin{bmatrix}
f(n - 2) \\
f(n - 3)
\end{bmatrix}
=
... \\
=
\begin{bmatrix}
1 & 1 \\
1 & 0
\end{bmatrix} ^ {n-1}
\begin{bmatrix}
f(1) \\
f(0)
\end{bmatrix}
\\$$

Interesting... Now we actually just need to find out the value of:

$$\\

\begin{bmatrix}
1 & 1 \\
1 & 0
\end{bmatrix} ^ {n-1}

\\$$

Turns out there is a way to calculate the exponential of a square matrix in \\(O(logn)\\) time based on binary exponentiation.

Here is the basic idea of binary exponentiation. Consider exponential of a real number \\(a\\):

$$\\
\begin{align}

&a^{22} = a^{2 \times 11} = a^{11} \cdot a^{11} \\
&a^{11} = a^{2 \times 5 + 1} = (a^{5} \cdot a^{5} \cdot a) \\
&a^{5} = a^{2 \times 2 + 1} = (a^{2} \cdot a^{2} \cdot a) \\
&a^{2} = a^{2 \times 1} = a \cdot a

\end{align}
\\$$

We can see that to calculate \\(a^{22}\\), we do not need to multiply \\(a\\) 22 times. Instead, we keep performing ground division by 2 on the exponential value to split it up, and in case the exponential is odd, we multiply it by a to keep the equality. by doing this, we just need to calculate \\(log(n)\\) terms, in this case, \\(a^{11}, a^{5}\text{, and }a^{2}\\) to get the final answer.

> This method works because multiplication of real numbers is associative, meaning you can combine the factors in whichever way you like and the product does not change:
>
> $$\\
>
> a^{5} = a \cdot a \cdot a \cdot a \cdot a = (a \cdot a) \cdot (a \cdot a) \cdot a
>
> \\$$
>
> We can use the same idea on matrix exponentiation because matrix multiplication is also associative, [see proof here](https://www2.clarku.edu/faculty/djoyce/ma130/alglintrans.pdf).

Applying the same idea to calculate the matrix exponential, we have:

$$\\

\begin{bmatrix}
1 & 1 \\
1 & 0
\end{bmatrix} ^ k
=
\begin{bmatrix}
1 & 1 \\
1 & 0
\end{bmatrix} ^ {k // 2}
\begin{bmatrix}
1 & 1 \\
1 & 0
\end{bmatrix} ^ {k // 2}
\begin{bmatrix}
1 & 1 \\
1 & 0
\end{bmatrix} ^ {k\mod 2}
\\$$

where "//" means ground division. Now we can calculate the value by repeating this step until we get to the end cases: matrix raised to the power of 1 equals itself, and matrix raised to the power of 0 equals the identity matrix.

In short, we can find \\(f(n)\\) using:

$$\\
\begin{bmatrix}
f(n) \\
f(n - 1)
\end{bmatrix}
=
\begin{bmatrix}
1 & 1 \\
1 & 0
\end{bmatrix} ^ {n-1}
\begin{bmatrix}
f(1) \\
f(0)
\end{bmatrix}
\\$$

where

$$\\
\begin{bmatrix}
1 & 1 \\
1 & 0
\end{bmatrix} ^ {n-1}
\\$$

is calculated based on binary exponentiation in \\(O(logn)\\) time.

Following is the code:

```python
def matmul_2x2(a, b):
    return [
            [a[0][0] * b[0][0] + a[0][1] * b[1][0],
             a[0][0] * b[0][1] + a[0][1] * b[1][1]],
            [a[1][0] * b[0][0] + a[1][1] * b[1][0],
             a[1][0] * b[0][1] + a[1][1] * b[1][1]]
            ]
 
def fib_fast(n):
    if n == 0:
        return 0

    m = [[1, 1], 
         [1, 0]]
    i = [[1, 0], 
         [0, 1]]
    def matexp(k):
        if k == 0:
            return i
        k, mod = divmod(k, 2)
        r = matexp(k)
        return matmul_2x2(matmul_2x2(r, r), m if mod == 1 else i)

    return matexp(n - 1)[0][0]
```

Comparing this solution with the previous one, we can see that is has some overhead when n is small, but is significantly faster when n is large.

```shell
n = 2000, fibonacci - memo_2
Result:  4224696333392304878706725602341482782579852840250681098010280137314308584370130707224123599639141511088446087538909603607640194711643596029271983312598737326253555802606991585915229492453904998722256795316982874482472992263901833716778060607011615497886719879858311468870876264597369086722884023654422295243347964480139515349562972087652656069529806499841977448720155612802665404554171717881930324025204312082516817125
Time:  0:00:00.000315
n = 2000, fibonacci - fast
Result:  4224696333392304878706725602341482782579852840250681098010280137314308584370130707224123599639141511088446087538909603607640194711643596029271983312598737326253555802606991585915229492453904998722256795316982874482472992263901833716778060607011615497886719879858311468870876264597369086722884023654422295243347964480139515349562972087652656069529806499841977448720155612802665404554171717881930324025204312082516817125
Time:  0:00:00.000089
```

```shell
n = 2, fibonacci - memo_2
Time:  0:00:00.000036
n = 2, fibonacci - fast
check results: True
Time:  0:00:00.000006
n = 20, fibonacci - memo_2
Time:  0:00:00.000010
n = 20, fibonacci - fast
check results: True
Time:  0:00:00.000004
n = 200, fibonacci - memo_2
Time:  0:00:00.000023
n = 200, fibonacci - fast
check results: True
Time:  0:00:00.000004
n = 2000, fibonacci - memo_2
Time:  0:00:00.000249
n = 2000, fibonacci - fast
check results: True
Time:  0:00:00.000005
n = 10000, fibonacci - memo_2
Time:  0:00:00.002798
n = 10000, fibonacci - fast
check results: True
Time:  0:00:00.000008
```

# Ending

[![{{ site.github_username }} - {{ page.github_repo_name }}](https://img.shields.io/static/v1?label={{ site.github_username }}&message={{ page.github_repo_name }}&color=blue&logo=github)](https://github.com/{{ site.github_username }}/{{ page.github_repo_name }})

This post explained how to calculate the \\(n^{th}\\)fibonacci number in logarithmic time. Thanks for reading and see you in the next post! =^_^=