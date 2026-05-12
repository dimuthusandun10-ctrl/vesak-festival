import { createActor } from "@/backend";
import type { Role } from "@/backend";
import type { OrganizerPublicProfile, ReportNote } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useRegisterUser() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (displayName: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.registerUser(displayName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    },
  });
}

export function useGetMyProfile(principal: string | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["myProfile", principal],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMyProfile();
    },
    enabled: !!actor && !isFetching && !!principal,
    staleTime: 60_000,
  });
}

export function useListUsers() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["adminUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listUsers();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
  });
}

export function useSetUserRole() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ target, role }: { target: Principal; role: Role }) => {
      if (!actor) throw new Error("Not connected");
      return actor.setUserRole(target, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
  });
}

export function useDeleteUser() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (target: Principal) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteUser(target);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
  });
}

export function useGetPendingDansals() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["pendingDansals"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPendingDansals();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15_000,
  });
}

export function useApproveDansal() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.approveDansal(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingDansals"] });
      queryClient.invalidateQueries({ queryKey: ["dansals"] });
    },
  });
}

export function useRejectDansal() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.rejectDansal(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingDansals"] });
      queryClient.invalidateQueries({ queryKey: ["dansals"] });
    },
  });
}

export function useGetPendingPhotos() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["pendingPhotos"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPendingPhotos();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15_000,
  });
}

export function useApprovePhoto() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.approvePhoto(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingPhotos"] });
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
    },
  });
}

export function useRejectPhoto() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.rejectPhoto(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingPhotos"] });
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
    },
  });
}

export function useListReports() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listReports();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
  });
}

export function useDismissReport() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.dismissReport(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useActionReport() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.actionReport(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

// ──── New hooks for PIN, report notes, bio, organizer profile, notifications ────

export function useVerifyAdminPin() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async (pin: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.verifyAdminPin(pin);
    },
  });
}

export function useChangeAdminPin() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async ({
      oldPin,
      newPin,
    }: { oldPin: string; newPin: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.changeAdminPin(oldPin, newPin);
    },
  });
}

export function useAddReportNote() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      reportId,
      text,
    }: { reportId: bigint; text: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addReportNote({ reportId, text });
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["reportNotes", String(vars.reportId)],
      });
    },
  });
}

export function useGetReportNotes(reportId: bigint | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<ReportNote[]>({
    queryKey: ["reportNotes", String(reportId)],
    queryFn: async () => {
      if (!actor || reportId === null) return [];
      const result = await actor.getReportNotes(reportId);
      return result.map((n) => ({
        id: n.id,
        reportId: n.reportId,
        authorId: String(n.authorId),
        authorName: n.authorName,
        text: n.text,
        createdAt: n.createdAt,
      }));
    },
    enabled: !!actor && !isFetching && reportId !== null,
  });
}

export function useDeleteReportNote() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { noteId: bigint; reportId: bigint }) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteReportNote(vars.noteId);
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["reportNotes", String(vars.reportId)],
      });
    },
  });
}

export function useUpdateOrganizerBio() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bio: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateOrganizerBio(bio);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    },
  });
}

export function useGetOrganizerProfile(principalStr: string | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<OrganizerPublicProfile | null>({
    queryKey: ["organizerProfile", principalStr],
    queryFn: async () => {
      if (!actor || !principalStr) return null;
      const { Principal: IcPrincipal } = await import(
        "@icp-sdk/core/principal"
      );
      const p = IcPrincipal.fromText(principalStr);
      const result = await actor.getOrganizerProfile(p);
      if (!result) return null;
      return {
        principal: String(result.principal),
        name: result.name,
        bio: result.bio,
        avgRating: result.avgRating,
        totalDansals: result.totalDansals,
        totalViews: result.totalViews,
        totalLikes: result.totalLikes,
      };
    },
    enabled: !!actor && !isFetching && !!principalStr,
    staleTime: 60_000,
  });
}

export function useGetApprovalNotifications() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["approvalNotifications"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getApprovalNotifications();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10_000,
  });
}

export function useMarkNotificationSeen() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.markNotificationSeen(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvalNotifications"] });
    },
  });
}
