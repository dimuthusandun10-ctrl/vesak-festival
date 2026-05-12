import {
  type AddCommentRequest,
  type AddPhotoCommentRequest,
  type AddReviewRequest,
  createActor,
} from "@/backend";
import type {
  AddDansalRequest,
  AddPhotoRequest,
  DansalFilter,
  UpdateDansalRequest,
} from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useGetDansals() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["dansals"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getDansals();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
  });
}

export function useGetGalleryPhotos() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["gallery"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getGalleryPhotos();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15_000,
  });
}

export function useAddDansal() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (req: AddDansalRequest) => {
      if (!actor) throw new Error("Not connected");
      return actor.addDansal(req);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dansals"] });
    },
  });
}

export function useAppreciateDansal() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.appreciateDansal(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dansals"] });
    },
  });
}

export function useAddGalleryPhoto() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (req: AddPhotoRequest) => {
      if (!actor) throw new Error("Not connected");
      return actor.addGalleryPhoto(req);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
    },
  });
}

export function useAppreciatePhoto() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.appreciatePhoto(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
    },
  });
}

export function useUpdateDansal() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      req,
    }: { id: bigint; req: UpdateDansalRequest }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateDansal(id, req);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dansals"] });
      queryClient.invalidateQueries({ queryKey: ["myDansals"] });
    },
  });
}

export function useDeleteDansal() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteDansal(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dansals"] });
      queryClient.invalidateQueries({ queryKey: ["myDansals"] });
    },
  });
}

export function useFilterDansals(filter: DansalFilter) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["dansals", "filter", filter],
    queryFn: async () => {
      if (!actor) return [];
      return actor.filterDansals(filter);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
  });
}

export function useGetMyDansals(principal: string | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["myDansals", principal],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyDansals();
    },
    enabled: !!actor && !isFetching && !!principal,
    refetchInterval: 30_000,
  });
}
export function useToggleDansalLike() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dansalId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.toggleDansalLike(dansalId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dansals"] });
      queryClient.invalidateQueries({ queryKey: ["myDansals"] });
    },
  });
}

export function useTogglePhotoLike() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (photoId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.togglePhotoLike(photoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
    },
  });
}

export function useToggleFavorite() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dansalId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.toggleFavorite(dansalId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      queryClient.invalidateQueries({ queryKey: ["dansals"] });
    },
  });
}

export function useGetMyFavorites(principal: string | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["favorites", principal],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyFavorites();
    },
    enabled: !!actor && !isFetching && !!principal,
    refetchInterval: 30_000,
  });
}

export function useGetMyDansalAnalytics(principal: string | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["myDansalAnalytics", principal],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyDansalAnalytics();
    },
    enabled: !!actor && !isFetching && !!principal,
    refetchInterval: 30_000,
  });
}

export function useAddComment() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (req: AddCommentRequest) => {
      if (!actor) throw new Error("Not connected");
      return actor.addComment(req);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["comments", vars.dansalId] });
    },
  });
}

export function useGetComments(dansalId: bigint | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["comments", dansalId],
    queryFn: async () => {
      if (!actor || dansalId === null) return [];
      return actor.getComments(dansalId);
    },
    enabled: !!actor && !isFetching && dansalId !== null,
  });
}

export function useDeleteComment() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      dansalId: _dc,
    }: { id: bigint; dansalId: bigint }) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteComment(id);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["comments", vars.dansalId] });
    },
  });
}

export function useAddReview() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (req: AddReviewRequest) => {
      if (!actor) throw new Error("Not connected");
      return actor.addReview(req);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", vars.dansalId] });
      queryClient.invalidateQueries({ queryKey: ["rating", vars.dansalId] });
    },
  });
}

export function useGetReviews(dansalId: bigint | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["reviews", dansalId],
    queryFn: async () => {
      if (!actor || dansalId === null) return [];
      return actor.getReviews(dansalId);
    },
    enabled: !!actor && !isFetching && dansalId !== null,
  });
}

export function useDeleteReview() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      dansalId: _dr,
    }: { id: bigint; dansalId: bigint }) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteReview(id);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", vars.dansalId] });
      queryClient.invalidateQueries({ queryKey: ["rating", vars.dansalId] });
    },
  });
}

export function useGetAverageRating(dansalId: bigint | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["rating", dansalId],
    queryFn: async () => {
      if (!actor || dansalId === null) return 0;
      return actor.getAverageRating(dansalId);
    },
    enabled: !!actor && !isFetching && dansalId !== null,
  });
}

// Photo comment hooks
export function useGetPhotoComments(photoId: bigint | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["photoComments", photoId],
    queryFn: async () => {
      if (!actor || photoId === null) return [];
      return actor.getPhotoComments(photoId);
    },
    enabled: !!actor && !isFetching && photoId !== null,
  });
}

export function useAddPhotoComment() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (req: AddPhotoCommentRequest) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.addPhotoComment(req);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["photoComments", vars.photoId],
      });
    },
  });
}

export function useDeletePhotoComment() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      photoId: _pid,
    }: { id: bigint; photoId: bigint }) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.deletePhotoComment(id);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["photoComments", vars.photoId],
      });
    },
  });
}

export function useSubmitReport() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      req: Parameters<NonNullable<typeof actor>["submitReport"]>[0],
    ) => {
      if (!actor) throw new Error("Not connected");
      return actor.submitReport(req);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}
