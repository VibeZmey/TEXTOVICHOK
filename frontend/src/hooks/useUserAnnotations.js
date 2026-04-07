// src/hooks/useUserAnnotations.js
import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { userService, lyricsService } from '../api/apiService';
import { queryKeys } from '../query/keys';
import {useMemo} from "react";

export const useUserAnnotations = (userId, options = {}) => {
    const { withLyricsText = false } = options;
    const queryClient = useQueryClient();

    const annotationsQuery = useQuery({
        queryKey: queryKeys.annotations.user(userId),
        queryFn: () => userService.getUserAnnotations(userId).then(res => res.data || []),
        enabled: !!userId,
        staleTime: 1 * 60 * 1000,
    });

    const lyricsIds = useMemo(() => {
        if (!withLyricsText || !annotationsQuery.data) return [];
        return [...new Set(annotationsQuery.data.map(a => a.lyricsId).filter(Boolean))];
    }, [withLyricsText, annotationsQuery.data]);

    const lyricsResults = useQueries({
        queries: lyricsIds.map(id => ({
            queryKey: queryKeys.lyrics.detail(id),
            queryFn: () => lyricsService.getById(id).then(res => res.data),
            enabled: !!id,
            staleTime: 10 * 60 * 1000,
        })),
    });

    const lyricsMap = useMemo(() => {
        const map = {};
        lyricsIds.forEach((id, i) => {
            if (lyricsResults[i]?.data) {
                map[id] = lyricsResults[i].data;
            }
        });
        return map;
    }, [lyricsIds, lyricsResults]);

    const annotationsWithLyrics = useMemo(() => {
        if (!annotationsQuery.data) return [];
        return annotationsQuery.data.map(ann => ({
            ...ann,
            _lyrics: lyricsMap[ann.lyricsId],
            _lyricsText: lyricsMap[ann.lyricsId]?.text,
        }));
    }, [annotationsQuery.data, lyricsMap]);

    const invalidate = () =>
        queryClient.invalidateQueries({ queryKey: queryKeys.annotations.user(userId) });

    return {
        ...annotationsQuery,
        annotations: annotationsWithLyrics,
        lyricsMap,
        invalidate,
    };
};