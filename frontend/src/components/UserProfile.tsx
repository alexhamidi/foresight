import { UserButton, useUser } from "@clerk/nextjs";

export function UserProfile() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex items-center space-x-4 p-4">
      <div className="flex-1">
        <h2 className="text-xl font-semibold">{user?.firstName} {user?.lastName}</h2>
        <p className="text-gray-600">{user?.primaryEmailAddress?.emailAddress}</p>
      </div>
      <UserButton
        appearance={{
          elements: {
            userButtonAvatarBox: 'w-10 h-10',
          },
        }}
      />
    </div>
  );
}
