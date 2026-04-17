export type User = {
  id: string;
  email: string;
  user_metadata?: {
    display_name?: string | null;
  };
};

export type Session = {
  access_token: string;
  user: User;
};

export type Profile = {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  company_name: string | null;
  created_at: string;
  updated_at: string;
};

export type Website = {
  id: string;
  owner_id: string;
  domain: string;
  name: string;
  widget_color: string | null;
  widget_greeting: string | null;
  is_online: boolean | null;
  created_at: string;
  updated_at: string;
};

export type Chat = {
  id: string;
  website_id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_ip: string | null;
  visitor_location: string | null;
  status: "open" | "closed";
  started_at: string;
  closed_at: string | null;
  updated_at: string;
};

export type Message = {
  id: string;
  chat_id: string;
  sender: "visitor" | "agent";
  content: string;
  created_at: string;
};
