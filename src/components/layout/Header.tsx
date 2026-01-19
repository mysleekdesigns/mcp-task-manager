"use client";

import { useSession } from 'next-auth/react';
import { SettingsIcon, PlusIcon, MenuIcon } from 'lucide-react';
import { ProjectSelector } from './ProjectSelector';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession();

  if (!session?.user) {
    return null;
  }

  // Generate initials from user name or email
  const getInitials = () => {
    if (session.user?.name) {
      return session.user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (session.user?.email) {
      return session.user.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden text-muted-foreground hover:text-cyan-400"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <MenuIcon className="size-5" />
      </Button>

        {/* Left side - Project Selector */}
        <div className="flex items-center gap-4">
          <ProjectSelector className="min-w-[200px]" />
        </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side - Actions and User */}
      <div className="flex items-center gap-2">
        {/* Quick Actions Button */}
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-cyan-400 active:text-cyan-400"
          aria-label="Quick actions"
        >
          <PlusIcon className="size-5" />
        </Button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Settings Button */}
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-cyan-400 active:text-cyan-400"
          aria-label="Settings"
        >
          <SettingsIcon className="size-4" />
        </Button>

        {/* Separator */}
        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* User Avatar */}
        <Avatar className="size-8 cursor-pointer hover:ring-2 hover:ring-ring/20 transition-all">
          <AvatarImage
            src={session.user.image ?? undefined}
            alt={session.user.name ?? 'User'}
          />
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
