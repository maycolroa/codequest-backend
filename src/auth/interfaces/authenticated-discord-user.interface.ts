export interface AuthenticatedDiscordUser {
  discordId: string;
  username: string;
  email: string | null;
  avatarUrl: string | null;
}
