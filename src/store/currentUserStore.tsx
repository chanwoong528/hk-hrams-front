import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface CurrentUserStore {
  currentUser: User | null; //TODO: have to change to User type
  setCurrentUser: (user: User) => void;

  accessToken: string | null;
  setAccessToken: (accessToken: string) => void;

  refreshToken: string | null;
  setRefreshToken: (refreshToken: string) => void;
}

export const useCurrentUserStore = create<CurrentUserStore>()(
  persist(
    (set) => ({
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),

      accessToken: null,
      setAccessToken: (accessToken) => set({ accessToken }),

      refreshToken: null,
      setRefreshToken: (refreshToken) => set({ refreshToken }),
    }),
    {
      name: "current-user",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
