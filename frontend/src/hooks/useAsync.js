import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Run an async function (usually an API call) and track its state.
 *   const { data, loading, error, reload, setData } = useAsync(() => workoutsApi.list(), [])
 * `deps` works like useEffect deps: when they change, it runs again.
 */
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: undefined, loading: true, error: null })
  const callId = useRef(0)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps)

  const reload = useCallback(async () => {
    const id = ++callId.current
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const data = await run()
      if (id === callId.current) setState({ data, loading: false, error: null })
    } catch (error) {
      if (id === callId.current) setState((s) => ({ ...s, loading: false, error }))
    }
  }, [run])

  useEffect(() => {
    reload()
  }, [reload])

  const setData = useCallback(
    (update) =>
      setState((s) => ({ ...s, data: typeof update === 'function' ? update(s.data) : update })),
    [],
  )

  return { ...state, reload, setData }
}
