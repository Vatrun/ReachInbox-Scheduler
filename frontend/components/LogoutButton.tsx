import { logoutAction } from "@/lib/actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="w-full rounded-lg px-3 py-2 text-sm text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
      >
        Logout
      </button>
    </form>
  );
}
