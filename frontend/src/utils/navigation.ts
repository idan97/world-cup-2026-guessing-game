import { useRouter } from "next/navigation";

export const useNavigation = () => {
  const router = useRouter();

  return {
    toDashboard: () => router.push("/dashboard"),
    toLogin: () => router.push("/login"),
    toRegister: () => router.push("/register"),
    toManager: () => router.push("/manager"),
    toPredictions: () => router.push("/predictions"),
  };
};