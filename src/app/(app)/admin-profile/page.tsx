
"use client";

import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserCog, Briefcase, Phone, ShieldCheck, Building, Mail } from "lucide-react"; 
import { Separator } from "@/components/ui/separator";

export default function AdminProfilePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Card className="shadow-lg rounded-xl">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-7 w-48" /> 
            </div>
            <Skeleton className="h-4 w-72" /> {/* Description */}
          </CardHeader>
          <CardContent className="space-y-6 pt-2">
            {[...Array(6)].map((_, i) => ( // Increased to 6 for email
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32 mb-1" /> {/* Label */}
                <Skeleton className="h-5 w-3/4" /> {/* Value */}
                {i < 5 && <Skeleton className="h-px w-full mt-3" />}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return <p className="text-center text-muted-foreground">User not found. Please log in.</p>;
  }
  
  if (user.role !== 'admin' && user.role !== 'superuser') {
    return (
        <div className="space-y-8 text-center py-10">
            <UserCog className="h-16 w-16 mx-auto text-destructive" />
            <h1 className="text-2xl font-semibold">Access Denied</h1>
            <p className="text-muted-foreground">This profile page is for admin or superuser users only.</p>
        </div>
    );
  }

  const profileRoleName = user.role === 'admin' ? 'Administrator/Technician' : 'Super User';
  const profileTitle = user.role === 'admin' ? 'Admin Profile' : 'Super User Profile';
  const profilePageDescription = user.role === 'admin' ? 'administrator/technician' : 'super user';


  return (
    <div className="space-y-8 max-w-2xl mx-auto">
        <div className="flex flex-col items-start gap-2 mb-6">
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <ShieldCheck className="h-8 w-8 text-primary" /> {profileTitle}
            </h1>
            <p className="text-muted-foreground">
                View your {profilePageDescription} account information.
            </p>
        </div>
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-xl">Account Details</CardTitle>
          <CardDescription>Information associated with your {profilePageDescription} account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-2">
          <ProfileItem icon={<UserCog className="h-5 w-5 text-muted-foreground" />} label="Username (Nombre de Usuario)" value={user.username} />
          <Separator />
          <ProfileItem icon={<Mail className="h-5 w-5 text-muted-foreground" />} label="Email (Correo Electrónico)" value={user.email} />
          <Separator />
          <ProfileItem icon={<ShieldCheck className="h-5 w-5 text-muted-foreground" />} label="Role (Rol en Plataforma)" value={profileRoleName} />
          <Separator />
          <ProfileItem icon={<Building className="h-5 w-5 text-muted-foreground" />} label="Company (Empresa)" value={user.company || 'N/A'} />
          <Separator />
          <ProfileItem icon={<Briefcase className="h-5 w-5 text-muted-foreground" />} label="Position (Cargo)" value={user.position || 'N/A'} />
          <Separator />
          <ProfileItem icon={<Phone className="h-5 w-5 text-muted-foreground" />} label="Phone (Teléfono)" value={user.phone || 'N/A'} />
        </CardContent>
      </Card>
    </div>
  );
}

interface ProfileItemProps {
    icon: React.ReactNode;
    label: string;
    value: string;
}

function ProfileItem({ icon, label, value }: ProfileItemProps) {
    return (
        <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 mt-1">{icon}</div>
            <div className="flex-grow">
                <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
                <p className="text-md text-foreground font-semibold">{value}</p>
            </div>
        </div>
    );
}
