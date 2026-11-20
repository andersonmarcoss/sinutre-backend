import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { env } from '../config/env';
import { HttpError } from '../middlewares/error.middleware';

const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_USER_URL = 'https://api.github.com/user';

export function getGithubAuthorizeUrl() {
  const params = new URLSearchParams({
    client_id: env.github.clientId,
    redirect_uri: env.github.callbackUrl,
    scope: 'read:user',
  });
  return `${GITHUB_AUTHORIZE_URL}?${params.toString()}`;
}

export async function authenticateWithGithubCode(code: string) {
  const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: env.github.clientId,
      client_secret: env.github.clientSecret,
      code,
      redirect_uri: env.github.callbackUrl,
    }),
  });

  const tokenData = (await tokenResponse.json()) as {
    access_token?: string;
  };

  if (!tokenResponse.ok || !tokenData.access_token) {
    throw new HttpError(401, 'Falha ao obter access_token do GitHub.');
  }

  const userResponse = await fetch(GITHUB_USER_URL, {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'sinutre-back',
    },
  });

  const githubUser = (await userResponse.json()) as {
    id?: number;
    login?: string;
    name: string | null;
    avatar_url: string | null;
  };

  if (!userResponse.ok || !githubUser.id || !githubUser.login) {
    throw new HttpError(401, 'Falha ao obter dados do usuário no GitHub.');
  }

  const user = await prisma.user.upsert({
    where: { githubId: String(githubUser.id) },
    update: {
      githubLogin: githubUser.login,
      name: githubUser.name ?? githubUser.login,
      avatarUrl: githubUser.avatar_url ?? undefined,
    },
    create: {
      githubId: String(githubUser.id),
      githubLogin: githubUser.login,
      name: githubUser.name ?? githubUser.login,
      avatarUrl: githubUser.avatar_url ?? undefined,
    },
  });

  return jwt.sign({ sub: user.id }, env.jwtSecret, { expiresIn: '7d' });
}

export async function getUserProfileSummary(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      githubLogin: true,
      name: true,
      avatarUrl: true,
    },
  });

  if (!user) {
    throw new HttpError(404, 'Usuário não encontrado.');
  }

  return user;
}