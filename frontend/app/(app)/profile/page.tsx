import { ProfileForm } from "@/components/profile-form";
import { getProfile } from "@/lib/server-api";

export default async function ProfilePage() {
  const user = await getProfile();

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6">
      <h1 className="text-2xl font-semibold">Профиль</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Обновите имя и email, которые будут видны в вашем кабинете.
      </p>
      <div className="mt-6">
        <ProfileForm user={user} />
      </div>
    </div>
  );
}
