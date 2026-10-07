# Email Communications

## List of Contents

1. Account & Authentication
2. Recognition and Rewards
3. Campaigns
4. Approval Workflows: Nomination & CSV Points Upload
5. Award Quota Management
6. Budget & Points Management
7. Panel Awards
8. Redemption & Transactions
9. Milestones & Service Awards
10. Birthday & Greeting
11. Announcements and Social

---

## 01. Account & Authentication

### Email 01: Email Verification (for self registered user)

**Subject Line :** Please verify your email on {company _name}

Sent to a new user immediately upon self registration to confirm their email address. The user must click the verification link to activate their Vantage Circle account.

![Email sample: Email Verification (for self registered user)](images/p04_0.jpg)

### Email 02: Welcome Email (With SSO)

**Subject Line :** Welcome to {Company_Program}

Sent to a newly registered user with login link to get started on Vantage Circle. Also introduces key platform benefits of the products that the company has suscribed e.g. Vantage Rewards, Vantage Pulse, Vantage Fit, Vantage Perks.

![Email sample: Welcome Email (With SSO)](images/p05_0.jpg)

![Email sample: Welcome Email (With SSO)](images/p05_1.jpg)

### Email 03: Welcome Email (Without SSO)

**Subject Line :** Welcome to {Company_Program}

Sent to a newly registered user providing their platform login ID and temporary password to get started on Vantage Circle. Also introduces key platform benefits of the products that the company has suscribed e.g. Vantage Rewards, Vantage Pulse, Vantage Fit, Vantage Perks.

![Email sample: Welcome Email (Without SSO)](images/p06_0.jpg)

![Email sample: Welcome Email (Without SSO)](images/p06_1.jpg)

### Email 04: Password Reset Request

**Subject Line :** Reset password at {Your Company Rewards Hub}

Triggered when a user initiates a forgotten password request, sending a secure reset link to their registered email. Includes a fallback copy-paste URL in case the button doesn't work, ensuring the user can always regain access to their account.

![Email sample: Password Reset Request](images/p07_0.jpg)

### Email 05: Login OTP

**Subject Line :** Your Company Rewards Hub - One Time Password For Login

Sent when a user tries to login via OTP option that requires identity verification, delivering a one-time password valid for a limited time window. Advises the user not to share the OTP with anyone and directs them to support if the request wasn't initiated by them.

![Email sample: Login OTP](images/p08_0.jpg)

---

## 02. Recognition and Rewards

### Email 06: Appreciation Notification

*On receiving a Non-Monetary award*

**Subject Line :** Congratulations on receiving {Name of Badge} appreciation

Sent to an employee when their colleague recognizes them with a badge that carries no monetary value. Includes certificate attachment if the award has a certificate linked to it.

![Email sample: Appreciation Notification](images/p10_0.jpg)

### Email 07: Likes on Appreciation feed post

**Subject Line :** You got likes on the {Badge Name} appreciation post

Notifies an employee when their colleague likes on their appreciation post on the RnR social feed.

![Email sample: Likes on Appreciation feed post](images/p11_0.jpg)

### Email 08: Comment on Appreciation feed post

**Subject Line :** {User_name} commented on the {Badge Name} appreciation post

Notifies an employee when their colleague comments on their appreciation post on the RnR social feed.

![Email sample: Comment on Appreciation feed post](images/p12_0.jpg)

### Email 09: Award Notification

*On receiving a Monetary award*

**Subject Line :** Congratulations on receiving {Award_Name} award

Sent to an employee when their colleague recognizes them with a monetary award. Includes information of the points credit & certificate attachment if the award has a certificate linked to it.

![Email sample: Award Notification](images/p13_0.jpg)

### Email 10: Likes on Award feed post

**Subject Line :** You got likes on the {Award Name} AWARD post

Triggered when a colleague likes an employee's award post on the recognition feed, keeping the recipient informed of the social engagement their recognition is receiving. Shows the liker's name, award post name, and current like and comment counts, with a "View on Feed" CTA to view the full interaction.

![Email sample: Likes on Award feed post](images/p14_0.jpg)

### Email 11: Comments on Award feed post

**Subject Line :** {User_name} commented on the {award_name} AWARD post

Sent to an award recipient when one or more colleagues comment on their recognition post on the platform feed. Displays the commenter's name, a preview of the comment, and the total like and comment count, with a "View on Feed" CTA to engage with the conversation.

![Email sample: Comments on Award feed post](images/p15_0.jpg)

### Email 12: Only Points Credit

**Subject Line line:** {Employee name}, you have been awarded {n} points

Sent when an admin directly allocates points to an employee's account for a specific reason such as a festival bonus or performance reward. Includes the points value, equivalent currency amount, and quick links to redeem across partner brands.

![Email sample: Only Points Credit](images/p16_0.jpg)

### Email 13: Profile Badge Email

**Subject Line line:** Congratulations, {Employee Name} ! You've Earned a Profile Badge!

A Profile Badge is a form of recognition awarded to an employee based on the organisational values the employee has been awarded with. It is directly tied to the values awarded via non monetary recognition i.e Appreciation and does not consider monetary awards. The badge is displayed in the user’s profile. No elements of profile badge email is available for client customisation.

![Email sample: Profile Badge Email](images/p17_0.jpg)

![Email sample: Profile Badge Email](images/p17_1.jpg)

**Logic table**

| Parameter | Details |
|---|---|
| Frequency | 1st day of every calender quarter |
| Target Audience | All users on the platform |
| Trigger Condition | User falls in the top 10% of all users based on the appreciation given or received and feed engagement activity in previous calender quarter |
| Non Trigger Condition | If the user does not meet the top 10% threshold at the end of the quarter |

---

## 03. Campaigns

### Email 14: Campaign Start Intimation

**Subject Line:** {Campaign_Name} is LIVE Today! Who Will You Recognize?

Sent to employees when a recognition campaign goes live on the platform, announcing the campaign name, theme, and active participation window. Includes the campaign period (start and end dates), a step-by-step "How it Works" guide, and a "Participate Now" CTA to encourage employees to recognize deserving colleagues before the campaign closes.

![Email sample: Campaign Start Intimation](images/p19_0.jpg)

**Logic table**

| Parameter | Details |
|---|---|
| Frequency | One-time trigger per campaign |
| Trigger Condition | Sent 1 day before the campaign start date |
| Target Audience | All recipients configured for the campaign |

### Email 15: Campaign Badge Notification

**Subject Line:** Congratulations on receiving {Campaign_Badge} appreciation

Sent to an employee when they receive a badge as part of a specific organizational campaign or initiative running on the platform. Displays the campaign badge visual, the appreciator's name, and provides options to view the post on the platform or Microsoft Teams, along with a prompt to thank the recognizer.

![Email sample: Campaign Badge Notification](images/p20_0.jpg)

### Email 16: Campaign End Reminder

**Subject Line:** Last Chance! {Campaign_Name} Ends Tomorrow (DD-MM-YYYY) - Recognize Now

A last-chance nudge sent to employees one day before an active recognition campaign closes, urging them to participate before the window expires. Highlights the campaign end date prominently and reiterates the three-step recognition process with a "Participate Now" CTA to drive last-minute engagement.

![Email sample: Campaign End Reminder](images/p21_0.jpg)

**Logic table**

| Parameter | Details |
|---|---|
| Frequency | One-time reminder per campaign |
| Trigger Condition | Sent 2 days before the campaign end date |
| Target Audience | All recipients configured for the campaign |

---

## 04. Approval Workflows : Nomination & CSV Points Upload

### Email 17: Nomination Approval Request

**Subject Line :** New nomination is awaiting your approval

Sent to the designated approver when a new nomination is submitted and is pending their decision. Contains the nominee's details, award name, and allocated amount, along with a direct CTA to approve or review the nomination.

![Email sample: Nomination Approval Request](images/p23_0.jpg)

### Email 18: Approval reminder email

**Subject Line :** Reminder: Approve the pending Award(s)

A follow-up reminder sent to the approver when one or more nominations are still pending their action. Displays a structured table with nomination date, award name, badge visual, recipient, and nominator details, with a direct "Go To My Approval" CTA to take action without delay.

![Email sample: Approval reminder email](images/p24_0.jpg)

### Email 19: Nomination Approved

**Subject Line :** Your nomination for {Award_Name} award has been approved

Triggered when an approver approves a submitted nomination, confirming the recognition has gone through. The nominator is informed of the approval along with the recipient's name and award details, with a link to view the nomination status.

![Email sample: Nomination Approved](images/p25_0.jpg)

### Email 20: Nomination Declined

**Subject Line :** Your nomination for {Award_Name} award has been declined

Sent to the nominator when their submitted nomination has been rejected by the approver. Includes the reason for declination and a link to view the nomination status, helping the nominator understand the decision.

![Email sample: Nomination Declined](images/p26_0.jpg)

### Email 21: CSV Batch Approval Request

**Subject Line :** Process Employee Reward for Company Id : {id} Date : {date}

Triggered when a bulk points upload via CSV is submitted and requires admin-level approval before processing. Contains the batch ID, company ID, and a detailed table of employee names, award reasons, and point values pending authorization.

![Email sample: CSV Batch Approval Request](images/p27_0.jpg)

---

## 05. Award Quota Management

### Email 22: Quota Allocation Request

**Subject Line:** Request for additional award quota

Sent to the designated admin poc when a quota holder requests additional award quota for a specific award type. Includes the requester's name, award name, requested quantity, and justification, along with step-by-step instructions to allocate from the admin dashboard.

![Email sample: Quota Allocation Request](images/p29_0.jpg)

### Email 23: Quota Reminder Email

**Subject Line:** Make Your Quota Count – Recognize Your Colleagues

Sent to quota holders when they have unused recognition quota available in their account that has not yet been utilized. Displays a current balance summary with quota name, award name, and available count, with a "Recognize Now" CTA nudging them to use the quota and celebrate a peer's contribution.

![Email sample: Quota Reminder Email](images/p30_0.jpg)

**Logic table**

| Parameter | Details |
|---|---|
| Frequency | Bi-monthly — 10th and 25th of every month |
| Target Audience | Quota holders (Nominators) |
| Trigger Condition | Nominator has performed zero recognitions in the past 30 days from the trigger date. |
| No Email Condition | If nominator has performed at least 1 recognition in past 30 days |

---

## 06. Budget & Points Management

### Email 24: Budget Allocation Request

**Subject Line:** Request for budget allocation

Sent to designated admin POC when a budget holder raises request for additiona recognition budget. Email contains the details of Requester, Reason for request, Country of request, Requested amount

![Email sample: Budget Allocation Request](images/p32_0.jpg)

### Email 25: Budget Allocation

**Subject Line:** You have been allocated a budget of {Amount & Currency}

Sent to a budget holder when a recognition budget has been credited to their account for distributing points to employees. Contains a transaction summary including the allocated amount, country, reason, and date of transaction, with a link to view the full report.

![Email sample: Budget Allocation](images/p33_0.jpg)

### Email 26: Budget Utilization Reminder

**Subject Line:** Don’t let yout Rewards Budget go unused - start utilizing it now

Triggered automatically when a budget holder still has unutilized recognition budget sitting in their account. Displays a country-wise budget summary with available balances and nudges the budget holder to nominate employees with a "Nominate Now" CTA.

![Email sample: Budget Utilization Reminder](images/p34_0.jpg)

**Logic table**

| Parameter | Details |
|---|---|
| Frequency | Bi-monthly - 2nd and 4th Thursday of every month |
| Target Audience | Budget holders (Managers / SPOCs) |
| Trigger Condition | Budget holder has made zero recognitions in the past 15 days from the date of trigger and has an available budget balance in their account |
| No Email Condition | If budget holder has made at least 1 recognition in the past 15 days. |

### Email 27: Manager Insights

**Subject Line:** Recognition Summary of My Team

A monthly insights email sent to managers summarising their team's recognition activity for the previous month. Covers key metrics like total recognitions, points rewarded, team members recognized, feed engagement score, and most awarded value

![Email sample: Manager Insights](images/p35_0.jpg)

---

## 07. Panel Awards

### Email 28: Panel Award Nomination Start Notification

**Subject Line:** Nominations for Panel Awards Open

Sent to eligible employees when nominations open for a Panel Award, informing them of the awards available and their respective nomination deadlines. Encourages nominators to put forward deserving colleagues with a "Nominate Now" CTA, along with a table listing all active award names and closing dates.

![Email sample: Panel Award Nomination Start Notification](images/p37_0.jpg)

**Logic table**

| Parameter | Details |
|---|---|
| Frequency | One-time trigger per award cycle |
| Target Audience | All eligible nominators for the Panel Award |
| Trigger Condition | On the configured Nomination Start Date of the Panel Award |
| Stage | Stage 1 - Nomination Period begins |

### Email 29: Panel Award Nomination End Notification

**Subject Line:** Reminder: Panel Awards Nominations Closing Soon!

A closing reminder sent to employees when nominations for Panel Awards are about to end, urging them to submit before the deadline. Lists all award names and nomination end dates in a structured table with a final "Nominate Now" CTA to drive last-minute participation.

![Email sample: Panel Award Nomination End Notification](images/p38_0.jpg)

**Logic table**

| Parameter | Details |
|---|---|
| Frequency | One-time reminder per award cycle |
| Target Audience | All eligible nominators who have not yet submitted a nomination |
| Trigger Condition | System detects the Nomination End Date is approaching - sent 1 day before nomination phase |
| Stage | Stage 1 - Nomination Period closing soon |

### Email 30: Panel Award Nomination Approval by Reviewer Notification

**Subject Line:** Your nomination for {Panel Award Name} award has been approved

Sent to the nominator when their panel award nomination has been reviewed and approved by the designated reviewer. Confirms the nominee's name, award title, and provides a link to track the nomination's progress through the pipeline.

![Email sample: Panel Award Nomination Approval by Reviewer Notification](images/p39_0.jpg)

**Logic table**

| Parameter | Details |
|---|---|
| Frequency | Real-time, event-based trigger |
| Target Audience | Nominator who submitted the nomination |
| Trigger Condition | Reviewer/Approver approves a submitted nomination in the Review Period (Stage 2) |
| Stage | Stage 2 - Review Period (Optional) |

### Email 31: Panel Award Nomination Decline by Reviewer Notification

**Subject Line:** Your nomination for {Panel Award Name} award has been declined

Triggered when a panel award nomination is rejected by the reviewer, informing the nominator of the outcome. Includes the recipient name, award title, and a link to view the nomination status for transparency on the decision.

![Email sample: Panel Award Nomination Decline by Reviewer Notification](images/p40_0.jpg)

**Logic table**

| Parameter | Details |
|---|---|
| Frequency | Real-time, event-based trigger |
| Target Audience | Nominator who submitted the nomination |
| Trigger Condition | Reviewer/Approver declines a submitted nomination in the Review Period (Stage 2) |
| Stage | Stage 2 - Review Period (Optional) |

### Email 32: Panel Award Voting Start Notification

**Subject Line:** Vote for Panel Awards Nominees

Triggered when the voting phase begins for Panel Awards, notifying eligible voters that nominations are in and it's time to cast their vote. Displays award names, number of nominations received, and voting end dates in a clear table with a "Vote Now" CTA.

![Email sample: Panel Award Voting Start Notification](images/p41_0.jpg)

**Logic table**

| Parameter | Details |
|---|---|
| Frequency | One-time trigger per award cycle |
| Target Audience | All eligible panel voters for the award |
| Trigger Condition | On the configured Panel Voting Start Date - when nominations are finalized and voting opens |
| Stage | Stage 3 - Panel Voting begins |

### Email 33: Panel Awards Voting End Reminder

**Subject Line:** Last Day to Announce Panel Awards Winner(s).

A final nudge sent to voters when the Panel Awards voting window is about to close, reminding them to cast their vote before it ends. Reiterates the award names, number of nominations, and voting deadlines with an urgent "Vote Now" CTA.

![Email sample: Panel Awards Voting End Reminder](images/p42_0.jpg)

**Logic table**

| Parameter | Details |
|---|---|
| Frequency | One-time reminder per award cycle |
| Target Audience | All eligible panel voters for the award |
| Trigger Condition | System detects the Panel Voting End Date is approaching - sent 1 day before voting phase closes |
| Stage | Stage 3 - Panel Voting closing soon |

### Email 34: Panel Awards Winner Selection Start Notification

**Subject Line:** Announce Panel Awards Winner(s)

Sent to the designated panel award’s winner selector once voting closes, requesting them to officially select the winner(s) from the nominations. Includes a table of award names and total nominations received, with a "Select Winner" CTA to complete the final step.

![Email sample: Panel Awards Winner Selection Start Notification](images/p43_0.jpg)

**Logic table**

| Parameter | Details |
|---|---|
| Frequency | One-time trigger per award cycle |
| Target Audience | Designated award Winner/ SPOC responsible for selecting the winner |
| Trigger Condition | On the Winner Selection start date when voting closes and system prompts Winner Selector to select winner(s) |
| Stage | Stage 4 - Winner Selection begins |

### Email 35: Panel Awards Winner Selection Final Reminder

**Subject Line:** Last Day to Announce Panel Awards Winner(s)

A last-day reminder to the winner selector to finalize and announce the Panel Award winner(s) before the submission deadline expires. Displays all pending awards and nomination counts, with an urgent "Select Winner" CTA to ensure the process is completed on time.

![Email sample: Panel Awards Winner Selection Final Reminder](images/p44_0.jpg)

**Logic table**

| Parameter | Details |
|---|---|
| Frequency | One-time final reminder per award cycle |
| Target Audience | Designated award admin or panel manager |
| Trigger Condition | Final day of the winner selection window - Winner Selector has still not selected a winner |
| Stage | Stage 4 - Winner Selection last day |

### Email 36: Panel Award Winner Notification

**Subject Line:** Congratulations on receiving {Panel Award name} AWARD

Triggered when a panel award recipient is finalized and points are credited to their account. Congratulates the winner with the award badge visual, points value, and options to view the recognition, redeem points, or thank the nominator.

![Email sample: Panel Award Winner Notification](images/p45_0.jpg)

---

## 08. Redemption & Transactions

### Email 37: Vantage Points Redemption Confirmation

**Subject Line:** Redeemed Vantage Points confirmation

Sent to an employee immediately after they successfully redeem their Vantage Points for a gift card or voucher. Serves as a transaction receipt confirming the points deducted and the redemption details.

![Email sample: Vantage Points Redemption Confirmation](images/p47_0.jpg)

### Email 38: Voucher OTP

**Subject Line:** Please Verify Your OTP to Access Your Gift Voucher

Sent to the employee when they attempt to view their gift voucher details using the ‘View Code’ functionality from inside the VC platform, requiring OTP verification for security. The OTP is valid for only 5 minutes and must not be shared, ensuring the voucher information is accessed only by the rightful owner.

![Email sample: Voucher OTP](images/p48_0.jpg)

### Email 39: E-Gift Voucher Delivery (Click to Activate / C2A)

**Subject Line:** Redeemed Vantage Points confirmation

Sent to the employee immediately after they redeem a voucher via the Click to Activate (C2A) feature, confirming the deduction of Vantage Points from their account and providing a summary of the redemption details (voucher name, total price, date and time of redemption). Also includes guidance on where to find the redeemed voucher and how to request a resend if not received within 2 hours.

![Email sample: E-Gift Voucher Delivery (Click to Activate / C2A)](images/p49_0.jpg)

### Email 40: E-Gift Voucher Delivery (non- Click to Activate/ C2A)

**Subject Line:** E-Gift voucher from {Program_Name}

Triggered after a successful redemption to deliver the actual e-gift voucher details including the voucher code, brand, amount, and validity period. Acts as the final fulfilment email that the employee uses to redeem their reward at the respective brand.

![Email sample: E-Gift Voucher Delivery (non- Click to Activate/ C2A)](images/p50_0.jpg)

### Email 41: Gift Voucher Cancellation

**Subject Line:** E-Gift voucher canceled {Program_Name}

Sent when a previously issued e-gift voucher is cancelled, due to a system issue. Informs the employee of the cancellation and typically includes details about points being refunded back to their account.

![Email sample: Gift Voucher Cancellation](images/p51_0.jpg)

### Email 42: Points Redemption Reminder

**Subject Line:** Reminder: You Have { n } Reward Points – Redeem Now!

Sent to employees who have accumulated Vantage Points but haven't redeemed them yet, nudging them to convert points into rewards. Highlights the ease of redemption with benefits like wide brand choice, instant digital gift cards, and a direct "Redeem Now" CTA.

![Email sample: Points Redemption Reminder](images/p52_0.jpg)

**Logic table**

| Parameter | Scheduler 1 | Scheduler 2 |
|---|---|---|
| Frequency | 10th & 29th of every month | 14th & 28th of every month |
| Server | India | India & US |
| Target Audience | All users with points > 250 | Users with points > 250 (India) or > 5 (US) |
| Trigger Condition | No redemption in the last 30 days | No redemption in the last 30 days |
| Scope | All companies on India server | Whitelisted companies only |
| Remarks | Country & Client-wise PPU required | Non-whitelisted companies get Bell only. AmDocs gets Bell only across all countries |

### Email 43: Merchandise Order Confirmation

**Subject Line:** Your Merchandise order has been confirmed

Sent when an employee places an order for physical merchandise from the rewards catalogue. Confirms the order with item details, shipping details and tracking information.

![Email sample: Merchandise Order Confirmation](images/p53_0.jpg)

### Email 44: Merchandise (Order Shipped Mail)

**Subject Line:** Your Merchandise order has been shipped

Sent to the employee when their merchandise item has been shipped and is on its way to the delivery address. Includes the order details (product name, Order ID, shipped date), shipping details (mobile number, delivery address), and a "Track Order" CTA to follow the shipment progress.

![Email sample: Merchandise (Order Shipped Mail)](images/p54_0.jpg)

### Email 45: Merchandise (Out for Delivery Mail)

**Subject Line:** Your Milestone order is out for delivery

Sent to the employee when their merchandise order is out for delivery and on its way, giving them a heads-up before it arrives. Includes the order details (product name, Order ID, out-for-delivery date), shipping details (mobile number, delivery address), and a "Track Order" CTA to monitor the shipment in real time.

![Email sample: Merchandise (Out for Delivery Mail)](images/p55_0.jpg)

### Email 46: Merchandise (Order Delivered Email)

**Subject Line:** Your order has been delivered

Sent to the employee when their merchandise order has been successfully delivered to the provided address. Includes the order details (product name, Order ID, delivery date), shipping details (mobile number, delivery address), and a "Track Order" CTA for post-delivery reference.

![Email sample: Merchandise (Order Delivered Email)](images/p56_0.jpg)

### Email 47: Merchandise Order Cancellation

**Subject Line:** Transaction failed

Sent to an employee when their merchandise order could not be fulfilled and has been cancelled. Includes a breakdown of the cancelled item(s) and confirms that the full Vantage Points amount is refunded back to the employee's wallet.

![Email sample: Merchandise Order Cancellation](images/p57_0.jpg)

### Email 48: Amazon Transaction Failed

**Subject Line:** Amazon transaction failed

Triggered specifically when a points redemption attempt on the Amazon store integration fails to process. Notifies the employee of the failed transaction and guides them on next steps to retry or seek support.

![Email sample: Amazon Transaction Failed](images/p58_0.jpg)

### Email 49: Manager Giting (Giver Confirmation Email)

**Subject Line:** Gifting Successful

Sent to the manager immediately after they have successfully gifted a product to an employee through the Manager Gifting feature. Confirms the gift details including the gift name and recipient, with a "Gift More" CTA to encourage continued acts of goodwill.

![Email sample: Manager Giting (Giver Confirmation Email)](images/p59_0.jpg)

### Email 50: Manager Giting (Receiver Notification Email)

**Subject Line:** Congratulations, you received a gift!

Sent to the receiver when a manager gifts them a product, notifying them of the surprise along with the personalized message written by the manager. Includes a "Claim Gift Now" CTA prompting the receiver to add their preferred delivery address to complete the claim process.

![Email sample: Manager Giting (Receiver Notification Email)](images/p60_0.jpg)

### Email 51: Manager Giting (Receiver Claim Confirmation Email)

**Subject Line:** Gift successfully claimed

Sent to the receiver immediately after they successfully claim a gifted product through the platform. Confirms the claim is complete, displays the giver's name for reference, and includes a "Login Now" CTA to redirect them back to the platform.

![Email sample: Manager Giting (Receiver Claim Confirmation Email)](images/p61_0.jpg)

---

## 09. Milestones & Service Awards

### Email 52: Generic Work Anniversary Wish

**Subject Line:** Congratulations on your work anniversary!

The default work anniversary email sent to an employee on their tenure completion when no Long Service Award (LSA) or Service Yearbook is configured for the particular tenure. A simple yet warm system-generated congratulatory message acknowledging the employee's tenure milestone, with a "Login Now" CTA to visit the platform. Note: This is a generic wish email and can not be customised per client.

![Email sample: Generic Work Anniversary Wish](images/p63_0.jpg)

### Email 53: Long Service Award Notification (With Points)

**Subject Line:** Congratulations on your work anniversary!

Sent to an employee on their work anniversary when a Long Service Award with points is configured in the admin dashboard. Celebrates the milestone with the award image, a congratulatory message and credits the designated points amount directly to the employee's account. Includes certificate attachment if the award has a certificate linked to it.

![Email sample: Long Service Award Notification (With Points)](images/p64_0.jpg)

### Email 54: Long Service Award (Without Points)

**Subject Line:** Congratulations on your work anniversary!

Sent to an employee on their work anniversary when a Long Service Award without points is configured in the admin dashboard. Celebrates the milestone with the award image, a congratulatory message , without any points or monetary value attached. Includes certificate attachment if the award has a certificate linked to it.

![Email sample: Long Service Award (Without Points)](images/p65_0.jpg)

### Email 55: Service Yearbook : Share your Thoughts

**Subject Line:** {Employee} ‘s Work Anniversary is Approaching – Share Your Thoughts

Sent to selected colleagues inviting them to write a personal message or share thoughts ahead of a teammate's work anniversary. Goes out as two reminders - 7 days prior and again 3 days prior (frequencies can be changed as per client request)- to ensure maximum participation before the yearbook is compiled.

![Email sample: Service Yearbook : Share your Thoughts](images/p66_0.jpg)

**Logic table**

| Parameter | Details |
|---|---|
| Frequency | Default twice per anniversary cycle — 7 days prior and 3 days prior to the work anniversary. However, frequencies can be customised as per client requirement. |
| Target Audience | Selected peers/colleagues of the employee whose anniversary is approaching This can be configured basis client requirement. |
| Trigger Condition | System detects an upcoming work anniversary → automatically sends peer invite to submit thoughts and messages |
| Scope | Work anniversary milestones — applies to all employees who have their DOJ updated with the feature configured for their company |

### Email 56: Service Yearbook Delivery

**Subject Line:** Congratulations on your work anniversary!

Delivered to the employee on their work anniversary, containing a compiled digital yearbook of messages and wishes from their colleagues. The reporting manager is CC'd, making it a meaningful and shared celebration of the employee's journey.

![Email sample: Service Yearbook Delivery](images/p67_0.jpg)

### Email 57: Self-Invite Mail (Only for Wipro)

**Subject Line:** Countdown to your 5 years @ Wipro has begun - Invite Colleagues for sharing yearbook citations.

Sent to the employee with an upcoming work anniversary when Self Invite is enabled in the Service Yearbook configuration - triggered before or alongside the first peer "Share Your Thoughts" reminder. The employee can fill in their Self Bio form to add personal achievements and memories. Self Bio questions can be configured in the Admin Dashboard under Employee Testimonials while configuring a tenure award with SY.

![Email sample: Self-Invite Mail (Only for Wipro)](images/p68_0.jpg)

**Logic table**

| Parameter | Details |
|---|---|
| Frequency | One-time trigger per anniversary cycle |
| Target Audience | Employee with an upcoming work anniversary |
| Trigger Condition | Sent 7 days before the work anniversary (default) |
| Configurable | Trigger window can be customized per client request (e.g., Wipro — 28 days before anniversary) |
| No Email Condition | If Self Invite is not enabled in the Service Yearbook configuration for that company |
| Scope | Only applicable for companies with Self Invite enabled under Employee Testimonials in Service Yearbook settings |

### Email 58: Milestone Catalog (Curated Milestone Catalog has opened)

**Subject Line:** {User_Name} we have a gift for you!

Sent to an employee {n} days before their upcoming work anniversary milestone, alerting them the curated Milestone Catalog of gifts and experiences is available for redemption. Includes a "Redeem Now" CTA directing them to browse and select a reward of their choice from the catalog. The number of days before when the email will be triggered can be configured.

![Email sample: Milestone Catalog (Curated Milestone Catalog has opened)](images/p69_0.jpg)

### Email 59: Milestone Catalog (Redeem Reminder)

**Subject Line:** {User_Name} we have a gift for you!

Sent to an employee when only {n} days remain to redeem their Milestone Catalog reward, serving as a final nudge to ensure they don't miss the redemption window before their work anniversary. Includes a "Redeem Now" CTA and a note to ignore the email if they have already redeemed their gift. The number of days before when this reminder will be triggered can be configured.

![Email sample: Milestone Catalog (Redeem Reminder)](images/p70_0.jpg)

### Email 60: Milestone Catalog (Work Anniversary Day Email)

**Subject Line:** {User_Name} we have a gift for you!

Triggered on the exact day of the employee's work anniversary, this email wishes them on the milestone while simultaneously alerting them that the Milestone Catalog redemption window closes today. Includes a "Redeem Gift" CTA and a note to ignore if already redeemed.

![Email sample: Milestone Catalog (Work Anniversary Day Email)](images/p71_0.jpg)

### Email 61: Milestone Catalog (Work Anniversary Day Email)

**Subject Line:** Your Milestone order has been confirmed

Sent upon successful redemption of a service milestone reward, this email confirms the order details for the chosen gift and displays the shipping address along with an "Order History" CTA. It also includes notes on potential import duties and dispatch timelines.

![Email sample: Milestone Catalog (Work Anniversary Day Email)](images/p72_0.jpg)

### Retirement Yearbook
*Email trigger logic*

| Trigger (Days Before Retirement) | Email / Action | Sent To | Notes |
|---|---|---|---|
| Date of Retirement − 30 | Client shares retiree details | Internal (HR SPOC → VC) | Prerequisite; must be done at least 30 days before retirement |
| Date of Retirement − 21 | "Share Your Thoughts" invite email | Peers & Reporting Manager (RM) | Kicks off yearbook contribution collection before 21 days |
| Date of Retirement − 14 | Follow-up reminder email for feedback | Peers & Reporting Manager (RM) | Nudges contributors who haven't submitted yet before 14 days |
| Date of Retirement − 7 | Retirement Yearbook (PDF) emailed to retiree | Retiring Employee | Retiree can download directly; HR SPOC has 7-day window to print hard copy |
| Date of Retirement (Day 0) | Congratulations & Yearbook email | Retiring Employee | Celebratory email with colleague messages; no redemption CTA |

### Email 62: Retirement Yearbook (Share your thoughts mail)

**Subject Line:** Share your thoughts on Retirement for {User_Name} – Let’s Celebrate Their Journey!

Sent to colleagues when a fellow employee is approaching their retirement date, inviting them to contribute a heartfelt message, memory, or note of appreciation to a retirement yearbook curated as a farewell gift. Includes a "Share your Thoughts" CTA directing contributors to the yearbook submission page.

![Email sample: Retirement Yearbook (Share your thoughts mail)](images/p74_0.jpg)

### Email 63: Retirement Yearbook (Congratulations & Yearbook Email )

**Subject Line:** Congratulations - Wishing You a Happy and Rewarding Retirement

Sent to the retiring employee on their retirement day to congratulate them and share cherished memories and heartfelt messages collected from their colleagues via the retirement yearbook.

![Email Attachment: Retirement Yearbook (Congratulations & Yearbook Email )](images/p75_0.jpg)

![Email sample: Retirement Yearbook (Congratulations & Yearbook Email )](images/p75_1.jpg)

### Retirement Catalog
*Email trigger logic*

| Trigger (Days Before Retirement) | Email / Action | Sent To | Notes |
|---|---|---|---|
| Date of Retirement − 28 | Milestone Catalog Activation Email | Retiring Employee | Notifies retiree that their retirement Milestone Catalog is now active and available for redemption |
| Date of Retirement − 14 | Merchandise Redemption Reminder Email | Retiring Employee | Reminds retiree to redeem their retirement merchandise before their last day of active employment |

### Email 64: Retirement Catalog (Milestone Catalog Activation Email)

**Subject Line:** Redeem Your Milestone Awards Before Retirement

Sent to the retiree 28 days before their retirement date to notify them that their exclusive Milestone Catalog has been activated and is now available for redemption. Includes step-by-step instructions to access the catalog and a "Redeem Now" CTA, prompting them to select their well-deserved retirement reward at their convenience.

![Email sample: Retirement Catalog (Milestone Catalog Activation Email)](images/p77_0.jpg)

### Email 65: Retirement Catalog (Milestone Catalog Redemption Invite Email)

**Subject Line:** Unlock your Retirement Rewards

Sent to the retiree 14 days before their retirement date as a reminder to redeem their retirement merchandise from the Milestone Catalog before the window closes. Includes step-by-step redemption instructions (Login to platform → Milestone tab → Redeem Gift → Select Retirement) and a "Redeem Now" CTA, with a note to complete the selection before their last day of active employment.

![Email sample: Retirement Catalog (Milestone Catalog Redemption Invite Email)](images/p78_0.jpg)

---

## 10. Birthday & Greeting

### Email 66: Birthday Wish (Without Points)

**Subject Line:** Birthday wishes from {Program_name}

An automated birthday greeting sent by the platform on behalf of the organization on the employee's birthday. Carries a warm celebratory message from the program and may optionally include a gift or points as configured by the admin.

![Email sample: Birthday Wish (Without Points)](images/p80_0.jpg)

### Email 67: Birthday Wish (With Points)

**Subject Line:** Happy Birthday

An automated birthday greeting sent by the platform on behalf of the organization on the employee's birthday. Carries a warm celebratory message from the program and may optionally include a gift or points as configured by the admin.

![Email sample: Birthday Wish (With Points)](images/p81_0.jpg)

### Email 68: Greetings

**Subject Line:** {user_name}, you have been wished

Triggered when a colleague manually sends a wish or greeting to a fellow employee through the platform. Notifies the recipient with the sender's message, making personal gestures of appreciation visible and meaningful within the platform ecosystem.

![Email sample: Greetings](images/p82_0.jpg)

---

## 11. Announcements and Social

### Email 69: Announcement Notification

**Subject Line:** New Announcement - {Topic Headline}

Sent to employees when a new company announcement is posted on the platform by an admin. Contains the announcement title, a preview of the content, event details if applicable, and a "Login Now" CTA to view the full post.

![Email sample: Announcement Notification](images/p84_0.jpg)

---

## Thank You
