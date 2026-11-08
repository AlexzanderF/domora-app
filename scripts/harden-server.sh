#!/usr/bin/env bash
# One-time server hardening for the DOMORA beta VPS (Debian/Ubuntu).
# Run as root over SSH. Idempotent: safe to run again.
#
#   sudo ./harden-server.sh "<deploy public key>"
#
# What it does:
#   - creates a non-root `deploy` user in the docker group, authorised ONLY by
#     the given deploy key (add a separate personal key yourself for the tunnel)
#   - ufw: deny incoming except 22/80/443
#   - sshd: no root login, no password login
#   - Postgres stays on 127.0.0.1:5432 (see compose.yaml); reach it with
#       ssh -N -L 5432:127.0.0.1:5432 deploy@<server-ip>
#
# Before closing your root session, confirm you can still log in as `deploy`
# from a second terminal.
set -euo pipefail

DEPLOY_USER="${DEPLOY_USER:-deploy}"
DEPLOY_KEY="${1:?usage: harden-server.sh \"<ssh public key for the deploy user>\"}"
APP_DIR="${APP_DIR:-/opt/domora-app}"

if [[ $EUID -ne 0 ]]; then
  echo "Run as root." >&2
  exit 1
fi

# --- deploy user -----------------------------------------------------------
if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" "$DEPLOY_USER"
fi
usermod -aG docker "$DEPLOY_USER"

install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
AUTH="/home/$DEPLOY_USER/.ssh/authorized_keys"
touch "$AUTH"
grep -qxF "$DEPLOY_KEY" "$AUTH" || echo "$DEPLOY_KEY" >> "$AUTH"
chown "$DEPLOY_USER:$DEPLOY_USER" "$AUTH"
chmod 600 "$AUTH"

install -d -m 755 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$APP_DIR"

# --- firewall --------------------------------------------------------------
apt-get install -y ufw >/dev/null
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# --- sshd ------------------------------------------------------------------
# sshd keeps the FIRST value it sees, so this must sort before e.g. 50-cloud-init.conf.
cat > /etc/ssh/sshd_config.d/00-domora-hardening.conf <<'CONF'
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
CONF
sshd -t
systemctl reload ssh || systemctl reload sshd

echo "Done. Verify: ssh $DEPLOY_USER@<server-ip>, then 'ufw status verbose'."
