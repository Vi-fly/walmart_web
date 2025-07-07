import sys

def solve():
    """
    Solves a single test case using the efficient greedy deletion strategy.
    This approach is fast enough to pass the time limits.
    """
    try:
        n = int(sys.stdin.readline())
        a = list(map(int, sys.stdin.readline().split()))
    except (ValueError, IndexError):
        return

    # d is the current candidate array, which we modify by deleting elements.
    d = list(a)

    while True:
        # If d becomes empty, no non-empty derangement can be formed.
        if not d:
            print("NO")
            return

        # c is the sorted version of d, used to check for fixed points.
        c = sorted(d)
        
        fixed_point_idx = -1
        # Find the first index i where d[i] is in its sorted position.
        for i in range(len(d)):
            if d[i] == c[i]:
                fixed_point_idx = i
                break
        
        # If no fixed point is found, d is a derangement. We found a solution.
        if fixed_point_idx == -1:
            print("YES")
            print(len(d))
            print(*d)
            return
        else:
            # Otherwise, delete the element at the first fixed point and repeat the process.
            d.pop(fixed_point_idx)

def main():
    """
    Main function to read the number of test cases and run the solver for each.
    """
    try:
        num_test_cases = int(sys.stdin.readline())
    except (ValueError, IndexError):
        return
        
    for _ in range(num_test_cases):
        solve()

if __name__ == "__main__":
    main()