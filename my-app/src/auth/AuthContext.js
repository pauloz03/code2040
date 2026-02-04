import { createContext, useState, useEffect } from 'react';
import {client} from '../Supabase/Client';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    };
    return context;
}

