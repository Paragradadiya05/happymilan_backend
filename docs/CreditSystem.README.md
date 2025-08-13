# Credit System Documentation

## Overview

The Credit System is a comprehensive payment and credit management module for the HappyMilan backend. It handles user credit balances, transaction history, mobile number access requests, and payment integrations with strict validation rules to ensure data consistency.

## Architecture

### Core Components

- **Credit Model**: Tracks user credit balances
- **Credit History Model**: Maintains audit trail of all credit transactions
- **Mobile Number Request Model**: Manages mobile number access requests
- **Credit Service**: Centralized business logic for credit operations
- **Payment Webhooks**: Razorpay integration for automatic credit allocation

### Key Features

- 🔒 **Atomic Transactions**: Prevents race conditions and ensures data consistency
- 📊 **Complete Audit Trail**: Every credit change is logged with metadata
- 🚫 **Negative Balance Prevention**: Credits cannot go below zero
- 🔔 **Real-time Notifications**: Firebase integration for instant updates
- 💳 **Payment Integration**: Automatic credit allocation on successful payments

---

## Database Models

### Credit Model (`models/credit.model.js`)

Tracks the current credit balance for each user.

```javascript
{
  userId: ObjectId,           // Reference to User
  creditBalance: Number,      // Current balance (min: 0)
  createdAt: Date,
  updatedAt: Date,
  isDeleted: Boolean
}
```

**Key Features:**

- Minimum balance constraint (cannot be negative)
- Soft delete support
- Automatic timestamp management

### Credit History Model (`models/creditHistory.model.js`)

Maintains a complete audit trail of all credit transactions.

```javascript
{
  creditId: ObjectId,         // Reference to Credit record
  userId: ObjectId,           // Reference to User
  transactionType: String,    // 'credit' | 'debit' | 'reset'
  amount: Number,             // Transaction amount
  balanceBeforeTransaction: Number,
  balanceAfterTransaction: Number,
  reason: String,             // Description of transaction
  planId: ObjectId,           // Reference to Plan (if applicable)
  paymentId: String,          // Payment gateway ID (if applicable)
  metadata: Object,           // Additional transaction data
  createdAt: Date,
  updatedAt: Date,
  isDeleted: Boolean
}
```

**Transaction Types:**

- `credit`: Adding credits to user account
- `debit`: Deducting credits from user account
- `reset`: Admin reset of user credits

### Mobile Number Request Model (`models/mobileNumberRequest.model.js`)

Manages requests for accessing other users' mobile numbers.

```javascript
{
  requesterId: ObjectId,      // User making the request
  targetUserId: ObjectId,     // User whose number is requested
  status: String,             // 'pending' | 'accepted' | 'declined'
  creditsCost: Number,        // Credits deducted for this request
  requestedAt: Date,
  respondedAt: Date,
  expiresAt: Date,
  createdAt: Date,
  updatedAt: Date,
  isDeleted: Boolean
}
```

---

## API Endpoints

### User Credit APIs

#### Get User Credits

```http
GET /api/user/credits
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "creditBalance": 50,
    "userId": "64a1b2c3d4e5f6789abcdef0"
  }
}
```

#### Get Credit History

```http
GET /api/user/credits/history?page=1&limit=10
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "docs": [
      {
        "transactionType": "credit",
        "amount": 100,
        "balanceAfterTransaction": 150,
        "reason": "Plan purchase",
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "totalDocs": 25,
    "limit": 10,
    "page": 1,
    "totalPages": 3
  }
}
```

### Mobile Number Request APIs

#### Create Mobile Number Request

```http
POST /api/user/mobile-number-request
Authorization: Bearer <token>
Content-Type: application/json

{
  "targetUserId": "64a1b2c3d4e5f6789abcdef1"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Mobile number request sent successfully",
  "data": {
    "requestId": "64a1b2c3d4e5f6789abcdef2",
    "status": "pending",
    "creditsCost": 10,
    "expiresAt": "2024-01-16T10:30:00Z"
  }
}
```

#### Accept Mobile Number Request

```http
PUT /api/user/mobile-number-request/:requestId/accept
Authorization: Bearer <token>
```

#### Decline Mobile Number Request

```http
PUT /api/user/mobile-number-request/:requestId/decline
Authorization: Bearer <token>
```

#### Get Mobile Number Requests

```http
GET /api/user/mobile-number-requests?status=pending&page=1&limit=10
Authorization: Bearer <token>
```

### Admin Credit APIs

#### Add Credits to User

```http
POST /api/admin/users/:userId/credits
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "amount": 100,
  "reason": "Manual credit addition"
}
```

#### Deduct Credits from User

```http
DELETE /api/admin/users/:userId/credits
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "amount": 50,
  "reason": "Manual deduction"
}
```

#### Reset User Credits

```http
PUT /api/admin/users/:userId/credits/reset
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "newBalance": 0,
  "reason": "Account reset"
}
```

#### Bulk Reset Credits

```http
POST /api/admin/credits/bulk-reset
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "userIds": ["64a1b2c3d4e5f6789abcdef0", "64a1b2c3d4e5f6789abcdef1"],
  "newBalance": 50,
  "reason": "Bulk credit reset"
}
```

---

## Credit Service (`services/credit.service.js`)

### Core Methods

#### `addCredits(userId, amount, reason, metadata)`

Adds credits to a user's account with atomic transaction.

```javascript
const result = await creditService.addCredits(userId, 100, 'Plan purchase', {
  planId: 'premium_plan_id',
  paymentId: 'pay_123',
});
```

#### `deductCredits(userId, amount, reason, metadata)`

Deducts credits from a user's account with validation.

```javascript
const result = await creditService.deductCredits(userId, 10, 'Mobile number request', { targetUserId: 'target_user_id' });
```

#### `resetCredits(userId, newBalance, reason, metadata)`

Resets user credits to a specific balance.

```javascript
const result = await creditService.resetCredits(userId, 0, 'Account reset', { adminId: 'admin_user_id' });
```

#### `validateCreditConsistency(userId)`

Validates that user's credit balance matches their transaction history.

```javascript
const isConsistent = await creditService.validateCreditConsistency(userId);
```

---

## Payment Integration

### Razorpay Webhook (`controllers/common/razorpay.controller.js`)

The system automatically allocates credits when users purchase plans through Razorpay.

#### Webhook Flow:

1. User purchases a plan
2. Razorpay sends webhook notification
3. System verifies payment signature
4. Credits are automatically added to user's account
5. User receives notification about credit addition

#### Supported Events:

- `payment.captured`: Successful payment completion
- `payment.failed`: Payment failure handling

---

## Notification System

### Firebase Integration

The system sends real-time notifications for credit-related events:

#### Credit Addition Notification

```javascript
{
  title: "Credits Added",
  body: "100 credits have been added to your account",
  data: {
    type: "credit_added",
    amount: 100,
    newBalance: 150
  }
}
```

#### Mobile Number Request Notification

```javascript
{
  title: "Mobile Number Request",
  body: "Someone wants to view your mobile number",
  data: {
    type: "mobile_number_request",
    requestId: "64a1b2c3d4e5f6789abcdef2",
    requesterName: "John Doe"
  }
}
```

---

## Business Rules

### Credit System Rules

1. **No Negative Balances**: Credits cannot go below 0
2. **Insufficient Credit Protection**: Requests are blocked if user has insufficient credits
3. **Atomic Operations**: All credit changes use MongoDB transactions
4. **Complete Audit Trail**: Every credit change is logged in CreditHistory
5. **Balance Consistency**: User's credit balance must always match transaction history total

### Mobile Number Request Rules

1. **Credit Requirement**: Users must have sufficient credits (default: 10 credits)
2. **Request Expiry**: Requests expire after 24 hours if not responded
3. **Single Request Limit**: One pending request per target user
4. **Self-Request Prevention**: Users cannot request their own mobile number

---

## Error Handling

### Common Error Codes

| Error Code                 | Description                           | HTTP Status |
| -------------------------- | ------------------------------------- | ----------- |
| `INSUFFICIENT_CREDITS`     | User doesn't have enough credits      | 400         |
| `INVALID_CREDIT_AMOUNT`    | Invalid credit amount (negative/zero) | 400         |
| `USER_NOT_FOUND`           | Target user doesn't exist             | 404         |
| `REQUEST_EXPIRED`          | Mobile number request has expired     | 400         |
| `REQUEST_ALREADY_EXISTS`   | Pending request already exists        | 409         |
| `CREDIT_CONSISTENCY_ERROR` | Credit balance doesn't match history  | 500         |

### Example Error Response

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "You don't have enough credits for this action",
    "details": {
      "required": 10,
      "available": 5
    }
  }
}
```

---

## Testing

### Test Credit Operations

```javascript
// Add credits
const addResult = await creditService.addCredits(userId, 100, 'Test credit');

// Deduct credits
const deductResult = await creditService.deductCredits(userId, 50, 'Test deduction');

// Validate consistency
const isConsistent = await creditService.validateCreditConsistency(userId);
```

### Test Mobile Number Requests

```javascript
// Create request
const request = await mobileNumberRequestController.createMobileNumberRequest(req, res);

// Accept request
const acceptResult = await mobileNumberRequestController.acceptMobileNumberRequest(req, res);
```

---

## Configuration

### Environment Variables

```env
# Credit System Configuration
DEFAULT_MOBILE_REQUEST_COST=10
MOBILE_REQUEST_EXPIRY_HOURS=24
ENABLE_CREDIT_NOTIFICATIONS=true

# Firebase Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# Razorpay Configuration
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

---

## Monitoring and Logs

### Key Metrics to Monitor

- Total credits in system
- Daily credit transactions
- Failed credit operations
- Mobile number request success rate
- Payment webhook failures

### Log Entries

All credit operations are logged with structured data:

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "info",
  "operation": "credit_deduction",
  "userId": "64a1b2c3d4e5f6789abcdef0",
  "amount": 10,
  "reason": "Mobile number request",
  "balanceAfter": 40
}
```

---

## Future Enhancements

### Planned Features

- [ ] Credit gift system between users
- [ ] Promotional credit campaigns
- [ ] Credit expiry management
- [ ] Advanced analytics dashboard
- [ ] Multi-currency credit support
- [ ] Credit earning through app activities

### Performance Optimizations

- [ ] Redis caching for credit balances
- [ ] Batch processing for bulk operations
- [ ] Database indexing optimization
- [ ] Credit balance snapshots

---

## Support

For technical support or questions about the credit system:

- Review this documentation
- Check the API validation schemas in `/validations/`
- Examine service layer logic in `/services/credit.service.js`
- Verify model constraints in `/models/`

## Security Considerations

### Data Protection

- All credit operations require proper authentication
- Admin operations require elevated privileges
- Payment webhooks use signature verification
- User data is protected with proper access controls

### Audit Trail

- Complete transaction history is maintained
- All changes include reason and metadata
- Admin actions are logged with operator details
- Failed operations are tracked for security monitoring
