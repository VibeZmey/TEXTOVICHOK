// src/query/queryClient.js
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // Данные "свежие" 5 минут (не будут рефетчиться при переключении вкладок)
            cacheTime: 30 * 60 * 1000, // Неактивные данные хранятся в кэше 30 минут
            retry: 1, // Повторить запрос 1 раз при сетевой ошибке
            refetchOnWindowFocus: false, // Не делать рефетч при возврате на вкладку (можно включить при необходимости)
            suspense: false, // Не использовать Suspense (пока не настроим границы)
        },
        mutations: {
            retry: false, // Не повторять мутации автоматически (чтобы не создать дубликаты записей)
        },
    },
});