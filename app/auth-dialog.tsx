'use client';

import { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { CheckCircle2, Code2, Loader2, LogOut, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@/lib/supabase/client';

type AuthDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
};

export function AuthDialog({ open, onOpenChange, user }: AuthDialogProps) {
  const [mode, setMode] = useState('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const changeOpen = (nextOpen: boolean) => {
    if (!nextOpen) {
      setPassword('');
      setError('');
      setMessage('');
    }
    onOpenChange(nextOpen);
  };

  const submit = async () => {
    setPending(true);
    setError('');
    setMessage('');
    const supabase = createClient();

    if (mode === 'signup') {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: name.trim(),
            account_type: 'developer',
          },
        },
      });

      if (signUpError) setError(signUpError.message);
      else if (data.session) {
        setMessage('Developer account created. You are now signed in.');
        changeOpen(false);
      } else {
        setMessage('Check your inbox to confirm your developer account.');
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) setError(signInError.message);
      else changeOpen(false);
    }

    setPending(false);
  };

  const signOut = async () => {
    setPending(true);
    await createClient().auth.signOut();
    setPending(false);
    changeOpen(false);
  };

  const displayName =
    (user?.user_metadata.full_name as string | undefined) || user?.email;

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent className="auth-dialog">
        {user ? (
          <>
            <DialogHeader>
              <span className="auth-mark">
                <Code2 />
              </span>
              <DialogTitle>{displayName}</DialogTitle>
              <DialogDescription>{user.email}</DialogDescription>
            </DialogHeader>
            <div className="account-status">
              <CheckCircle2 />
              <div>
                <strong>Developer account</strong>
                <span>Signed in and ready to publish architectures.</span>
              </div>
            </div>
            <Button
              variant="outline"
              className="full-button"
              onClick={signOut}
              disabled={pending}
            >
              {pending ? <Loader2 className="auth-spinner" /> : <LogOut />}
              Sign out
            </Button>
          </>
        ) : (
          <>
            <DialogHeader>
              <span className="auth-mark">
                <CloudAuthIcon />
              </span>
              <DialogTitle>Join Cloudcraft</DialogTitle>
              <DialogDescription>
                Sign in to publish, fork, and collaborate on cloud
                architectures.
              </DialogDescription>
            </DialogHeader>
            <Tabs value={mode} onValueChange={setMode} className="auth-tabs">
              <TabsList>
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>
              <TabsContent value="signin" />
              <TabsContent value="signup" />
            </Tabs>
            <form
              className="auth-form"
              onSubmit={(event) => {
                event.preventDefault();
                void submit();
              }}
            >
              {mode === 'signup' && (
                <label htmlFor="auth-name">
                  Display name
                  <Input
                    id="auth-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                    required
                  />
                </label>
              )}
              <label htmlFor="auth-email">
                Email
                <Input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </label>
              <label htmlFor="auth-password">
                Password
                <Input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete={
                    mode === 'signup' ? 'new-password' : 'current-password'
                  }
                  minLength={8}
                  required
                />
              </label>
              {error && (
                <p className="auth-feedback error" role="alert">
                  {error}
                </p>
              )}
              {message && (
                <output className="auth-feedback success">
                  <Mail /> {message}
                </output>
              )}
              <Button type="submit" className="full-button" disabled={pending}>
                {pending && <Loader2 className="auth-spinner" />}
                {mode === 'signup' ? 'Create developer account' : 'Sign in'}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CloudAuthIcon() {
  return <Code2 />;
}
