import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

type AuthContextType = {
    session: Session | null;
    user: User | null;
    isLoading: boolean;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    isLoading: true,
    signOut: async () => { }
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        console.log("AuthProvider: Mounting...");
        supabase.auth.getSession().then(({ data: { session } }) => {
            console.log("AuthProvider: Got Initial Session", !!session);
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoading(false);
        }).catch(err => {
            console.error("AuthProvider Error:", err);
            setIsLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log("AuthProvider: Auth Change Event", _event);
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ session, user, isLoading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};
