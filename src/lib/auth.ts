import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { UserRole } from "@prisma/client"; 
import bcrypt from "bcrypt";
import { prisma } from "@/lib/db"; // Import the shared PrismaClient instance

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      role?: UserRole;
    }
  }
  
  interface User {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    role?: UserRole;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    sub: string;
    role?: UserRole;
  }
}

export const authOptions: NextAuthOptions = {
  // @ts-ignore - Type compatibility issue between custom Prisma client and adapter
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (credentials?.email && credentials?.password) {
          // Find user by email
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            select: {
              id: true,
              name: true,
              email: true,
              password: true,
              role: true,
            },
          });
          
          // Verify that user exists and password is correct
          if (user && user.password) {
            // Compare the provided password with stored hash
            const passwordMatch = await bcrypt.compare(credentials.password, user.password);
            
            if (passwordMatch) {
              return {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
              };
            }
          }
          
          // If user not found, return null for failed authentication
          return null;
          
        }
        return null;
      }
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
      }

      // Refresh the role from database on each token refresh
      // This ensures the role is up-to-date if it was changed
      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true }
        });
        
        if (dbUser) {
          token.role = dbUser.role;
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.sub!;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
};
