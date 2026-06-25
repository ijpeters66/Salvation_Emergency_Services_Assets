#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";

function printUsage() {
  console.log(`Usage:
  npm run qa:create-user -- --email qa@example.com --password "ChangeMe123!" [--name "QA Admin"] [--role system_admin]

You can also provide these values through environment variables:
  NEXT_PUBLIC_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  QA_USER_EMAIL
  QA_USER_PASSWORD
  QA_USER_DISPLAY_NAME
  QA_USER_ROLE_KEY
`);
}

function readArg(flag) {
  const index = process.argv.indexOf(flag);

  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

function requireValue(value, label) {
  if (!value) {
    throw new Error(`Missing required value: ${label}`);
  }

  return value;
}

async function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    printUsage();
    return;
  }

  const supabaseUrl = requireValue(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireValue(process.env.SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY");
  const email = requireValue(readArg("--email") ?? process.env.QA_USER_EMAIL, "QA user email");
  const password = requireValue(readArg("--password") ?? process.env.QA_USER_PASSWORD, "QA user password");
  const displayName = readArg("--name") ?? process.env.QA_USER_DISPLAY_NAME ?? "QA User";
  const roleKey = readArg("--role") ?? process.env.QA_USER_ROLE_KEY ?? "system_admin";

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: role, error: roleError } = await supabase
    .from("role")
    .select("id, key")
    .eq("key", roleKey)
    .single();

  if (roleError || !role) {
    throw new Error(`Could not find role "${roleKey}". Run migrations first and confirm the role exists.`);
  }

  const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: displayName,
    },
  });

  const user = createdUser.user;

  if (createError && createError.message !== "A user with this email address has already been registered") {
    throw createError;
  }

  let userId = user?.id;

  if (!userId) {
    const { data: existingUser, error: existingUserError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (existingUserError) {
      throw existingUserError;
    }

    userId = existingUser.users.find((candidate) => candidate.email?.toLowerCase() === email.toLowerCase())?.id;
  }

  userId = requireValue(userId, "QA user id");

  const { error: profileError } = await supabase.from("app_user_profile").upsert(
    {
      user_id: userId,
      role_id: role.id,
      display_name: displayName,
    },
    {
      onConflict: "user_id",
    },
  );

  if (profileError) {
    throw profileError;
  }

  console.log(`QA user ready:
  email: ${email}
  role: ${role.key}
  display name: ${displayName}
  password: ${password}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
