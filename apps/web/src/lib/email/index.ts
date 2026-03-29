import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`

// ---------- Welcome Email ----------

export async function sendWelcomeEmail(email: string, name: string) {
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: '🏌️ Welcome to GolfGive — You\'re in!',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h1 style="color:#16a34a;">Welcome, ${name}! 🎉</h1>
        <p>You've successfully joined GolfGive — where your golf game makes a real difference.</p>
        <h3>What happens next?</h3>
        <ul>
          <li>Enter your last 5 Stableford scores</li>
          <li>Choose your charity to support</li>
          <li>You're automatically entered into the next monthly draw</li>
        </ul>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
           style="background:#16a34a;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">
          Go to Dashboard
        </a>
      </div>
    `,
  })
}

// ---------- Draw Results Email ----------

export async function sendDrawResultsEmail(
  email: string,
  name: string,
  drawTitle: string,
  winningNumbers: number[],
  matchType: string,
  prizeAmount?: number
) {
  const won = matchType !== 'no-match'

  return resend.emails.send({
    from: FROM,
    to: email,
    subject: won
      ? `🏆 You WON in the ${drawTitle}!`
      : `📊 ${drawTitle} Results Are In`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h1 style="color:${won ? '#d97706' : '#16a34a'};">
          ${won ? '🏆 You\'re a Winner!' : `${drawTitle} Results`}
        </h1>
        <p>Hi ${name},</p>
        <p>The winning numbers were: <strong>${winningNumbers.join(' · ')}</strong></p>
        ${won ? `
          <div style="background:#fef3c7;padding:20px;border-radius:8px;margin:20px 0;">
            <h2>You matched ${matchType}! 🎉</h2>
            ${prizeAmount ? `<p>Prize: <strong>£${prizeAmount.toFixed(2)}</strong></p>` : ''}
            <p>Log in to verify your winnings and claim your prize.</p>
          </div>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/winnings"
             style="background:#d97706;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">
            Claim Your Prize
          </a>
        ` : `
          <p>Unfortunately you didn't match this month — but there's always next month! 🏌️</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
             style="background:#16a34a;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">
            View Dashboard
          </a>
        `}
      </div>
    `,
  })
}

// ---------- Winner Verification Emails ----------

export async function sendVerificationApprovedEmail(
  email: string,
  name: string,
  prizeAmount: number
) {
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: '✅ Verification Approved — Payment Coming Soon!',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h1 style="color:#16a34a;">Your verification was approved! ✅</h1>
        <p>Hi ${name},</p>
        <p>Great news! Your winning submission has been verified.</p>
        <p>Your prize of <strong>£${prizeAmount.toFixed(2)}</strong> will be paid within 3–5 business days.</p>
      </div>
    `,
  })
}

export async function sendVerificationRejectedEmail(
  email: string,
  name: string,
  reason?: string
) {
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: '❌ Verification Unsuccessful',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h1 style="color:#dc2626;">Verification Unsuccessful</h1>
        <p>Hi ${name},</p>
        <p>Unfortunately we were unable to verify your winning submission.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <p>Please contact support if you believe this is an error.</p>
        <a href="mailto:${process.env.ADMIN_EMAIL}"
           style="background:#475569;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">
          Contact Support
        </a>
      </div>
    `,
  })
}

// ---------- Subscription Emails ----------

export async function sendSubscriptionCancelledEmail(email: string, name: string, endDate: string) {
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Your GolfGive subscription has been cancelled',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h1>Subscription Cancelled</h1>
        <p>Hi ${name},</p>
        <p>Your subscription has been cancelled. You'll continue to have access until <strong>${endDate}</strong>.</p>
        <p>We'd love to have you back anytime.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/subscribe"
           style="background:#16a34a;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">
          Resubscribe
        </a>
      </div>
    `,
  })
}
