/**
 * Hook genérico para chamadas assíncronas
 *
 * Controla loading, resultado e erro automaticamente.
 * Use para QUALQUER chamada à API sem repetir código.
 *
 * Exemplo:
 *   const { data, loading, error, execute } = useAsync(getCalories);
 *
 *   <AppButton title="Consultar" onPress={() => execute("uma paçoquinha")} loading={loading} />
 *   {data && <Text>{data}</Text>}
 *   {error && <Text>{error}</Text>}
 */

import { useCallback, useState } from 'react';

type UseAsyncReturn<TResult, TArgs extends unknown[]> = {
  /** O resultado da última chamada bem-sucedida */
  data: TResult | null;
  /** Se está carregando */
  loading: boolean;
  /** Mensagem de erro (ou null) */
  error: string | null;
  /** Dispara a chamada */
  execute: (...args: TArgs) => Promise<void>;
  /** Limpa tudo (resultado e erro) */
  reset: () => void;
  /** Define o resultado manualmente (útil para modo edição) */
  setData: (data: TResult | null) => void;
};

export function useAsync<TResult, TArgs extends unknown[]>(
  asyncFn: (...args: TArgs) => Promise<TResult>,
): UseAsyncReturn<TResult, TArgs> {
  const [data, setData] = useState<TResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (...args: TArgs) => {
      setLoading(true);
      setError(null);
      setData(null);
      try {
        const result = await asyncFn(...args);
        setData(result);
      } catch (err: any) {
        setError(err?.message ?? 'Erro inesperado');
      } finally {
        setLoading(false);
      }
    },
    [asyncFn],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, execute, reset, setData };
}
