import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface currentUserPayload {
  email: string;
  userId: string;
  koreanName?: string;
  departments: {
    departmentId: string;
    departmentName: string;
    isLeader?: boolean;
  }[];
}

interface CurrentUserStore {
  currentUser: currentUserPayload | null;
  setCurrentUser: (user: currentUserPayload) => void;
  clearCurrentUser: () => void;

  accessToken: string | null;
  setAccessToken: (accessToken: string) => void;
  clearAccessToken: () => void;

  refreshToken: string | null;
  setRefreshToken: (refreshToken: string) => void;
  clearRefreshToken: () => void;
}

export const useCurrentUserStore = create<CurrentUserStore>()(
  persist(
    (set) => ({
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),
      clearCurrentUser: () =>
        set({ currentUser: null, accessToken: null, refreshToken: null }),

      accessToken: null,
      setAccessToken: (accessToken) => set({ accessToken }),
      clearAccessToken: () => set({ accessToken: null }),

      refreshToken: null,
      setRefreshToken: (refreshToken) => set({ refreshToken }),
      clearRefreshToken: () => set({ refreshToken: null }),
    }),
    {
      name: "current-user",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
