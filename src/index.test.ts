import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import useTrailingAsync from '.';

describe('useTrailingAsync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('handles single async processing', async () => {
    const mockAsyncFn = vi.fn().mockResolvedValue('success');

    // Verify initial state.
    const { result } = renderHook(() =>
      useTrailingAsync<string, []>(mockAsyncFn),
    );
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.result).toBe(null);

    // Execute the async function.
    let returnValue;
    await act(async () => {
      returnValue = await result.current.execute();
    });

    // Verify that the function was called.
    expect(mockAsyncFn).toHaveBeenCalledTimes(1);

    // Verify state after execution.
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.result).toBe('success');
    expect(returnValue).toBe('success');
  });

  it('handles multiple async processing with trailing behavior', async () => {
    let activeResult = '';
    let activeResolver: ((value: string) => void) | null = null;

    const mockAsyncFn = vi.fn().mockImplementation(
      async () =>
        new Promise<string>((resolve) => {
          activeResolver = resolve;
        }),
    );

    const { result } = renderHook(() =>
      useTrailingAsync<string, []>(mockAsyncFn),
    );

    // → First call.
    await act(async () => {
      void result.current.execute();
      await Promise.resolve();
    });

    // Check that first call triggers execution and processing flag is set.
    expect(mockAsyncFn).toHaveBeenCalledTimes(1);
    expect(result.current.isProcessing).toBe(true);

    // → Second call.
    await act(async () => {
      void result.current.execute();
      await Promise.resolve();
    });

    // → Third call.
    await act(async () => {
      void result.current.execute();
      await Promise.resolve();
    });

    // Verify that there has been a single execution so far — from the first
    // call.
    expect(mockAsyncFn).toHaveBeenCalledTimes(1);

    // Now complete the first execution.
    await act(async () => {
      activeResult = 'first result';
      if (activeResolver) {
        activeResolver(activeResult);
      }
      await Promise.resolve();
    });

    // Update our active result.
    activeResult = 'third result';

    // After the first call completes, the hook should immediately start a
    // new execution.
    expect(mockAsyncFn).toHaveBeenCalledTimes(2);

    // Complete the second execution (which is from our third call).
    await act(async () => {
      if (activeResolver) {
        activeResolver(activeResult);
      }
      await Promise.resolve();
    });

    // Verify that no more executions have been triggered.
    expect(mockAsyncFn).toHaveBeenCalledTimes(2);

    // Final state should have updated result.
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.result).toBe('third result');
  });

  it('passes arguments to the async function correctly', async () => {
    const mockAsyncFn = vi
      .fn()
      .mockImplementation((arg1: string, arg2: number) =>
        Promise.resolve(`${arg1}-${String(arg2)}`),
      );

    const { result } = renderHook(() =>
      useTrailingAsync<string, [string, number]>(mockAsyncFn),
    );

    // Call with specific arguments.
    await act(async () => {
      await result.current.execute('test', 123);
    });

    // Verify that the function was called with correct arguments.
    expect(mockAsyncFn).toHaveBeenCalledWith('test', 123);
    expect(result.current.result).toBe('test-123');

    // Call again with different arguments.
    await act(async () => {
      await result.current.execute('another', 456);
    });

    // Verify that the function was called with correct arguments.
    expect(mockAsyncFn).toHaveBeenCalledWith('another', 456);
    expect(result.current.result).toBe('another-456');

    // Verify that the function was called a total of two times.
    expect(mockAsyncFn).toHaveBeenCalledTimes(2);
  });

  it('handles errors', async () => {
    const testError = new Error('Test error');
    const mockAsyncFn = vi.fn().mockRejectedValue(testError);

    const { result } = renderHook(() =>
      useTrailingAsync<string, []>(mockAsyncFn),
    );
    expect(result.current.error).toBe(null);

    // Execute the async function and expect it to throw.
    await act(async () => {
      await expect(result.current.execute()).rejects.toThrow('Test error');
    });

    // Verify error state.
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.error).toBe(testError);
    expect(result.current.result).toBe(null);
  });

  it('handles non-Error objects thrown by async function', async () => {
    const mockAsyncFn = vi.fn().mockImplementation(() => {
      // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
      return Promise.reject('not an error object');
    });

    const { result } = renderHook(() =>
      useTrailingAsync<string, []>(mockAsyncFn),
    );

    // Execute and expect a rejection with an Error object.
    await act(async () => {
      await expect(result.current.execute()).rejects.toThrow(
        'not an error object',
      );
    });

    // Verify the error state.
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('not an error object');
  });
});
