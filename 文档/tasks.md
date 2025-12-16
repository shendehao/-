# Implementation Plan

- [x] 1. Add CDN dependencies and create core JavaScript modules


  - [x] 1.1 Add qrcode.js and html5-qrcode CDN scripts to index.html


    - Add script tags for QRCode.js and html5-qrcode libraries
    - _Requirements: 1.1, 2.1_

  - [x] 1.2 Create QRCodeManager module for QR code generation


    - Implement generate(), download(), and printLabel() methods
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 1.3 Write property test for QR code round-trip consistency
    - **Property 1: QR Code Round-Trip Consistency**
    - **Validates: Requirements 1.4, 1.5**

- [x] 2. Implement camera scanning functionality


  - [x] 2.1 Create CameraScannerManager module

    - Implement open(), close(), onScanSuccess(), onScanError() methods
    - Handle camera permission requests and errors
    - _Requirements: 2.1, 2.2, 2.6, 2.7_

  - [x] 2.2 Create camera scanning modal HTML structure


    - Add modal with camera preview area and scanning overlay
    - Add close button and status messages
    - _Requirements: 2.2_

  - [x] 2.3 Implement scan result handling and item lookup

    - Query item by scanned code via API
    - Handle found/not found scenarios
    - _Requirements: 2.3, 2.4, 2.5_

- [x] 3. Implement quick inbound modal and functionality


  - [x] 3.1 Create QuickInboundManager module

    - Implement show(), close(), submitInbound() methods
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

  - [x] 3.2 Create quick inbound modal HTML structure

    - Add modal with item info display, quantity input, and action buttons
    - _Requirements: 4.1_

  - [x] 3.3 Implement quantity validation

    - Validate quantity > 0 before submission
    - Display validation error for invalid input
    - _Requirements: 4.4_

  - [ ]* 3.4 Write property test for quantity validation
    - **Property 4: Invalid Quantity Validation**
    - **Validates: Requirements 4.4**

  - [x] 3.5 Implement inbound API integration

    - Call POST /api/operations/inbound/ with item and quantity
    - Handle success and error responses
    - _Requirements: 4.2, 4.3_

  - [ ]* 3.6 Write property test for stock update correctness
    - **Property 3: Inbound Operation Updates Stock Correctly**
    - **Validates: Requirements 4.2, 4.3**

- [x] 4. Add dashboard scan inbound button


  - [x] 4.1 Add scan inbound button to dashboard action area


    - Add button next to existing "添加物品" button
    - Style consistently with other action buttons
    - _Requirements: 5.1_

  - [x] 4.2 Wire up button click to open camera scanner

    - Connect button click event to CameraScannerManager.open()
    - _Requirements: 5.2_

- [x] 5. Add QR code display to item details


  - [x] 5.1 Add QR code section to item detail view


    - Display QR code generated from item code
    - Show item code text below QR code
    - _Requirements: 1.1, 1.4_

  - [x] 5.2 Add print label and download buttons

    - Implement print label functionality
    - Implement QR code download as PNG
    - _Requirements: 1.2, 1.3_

  - [ ]* 5.3 Write property test for modal field display
    - **Property 2: Quick Inbound Modal Displays All Required Fields**
    - **Validates: Requirements 4.1**

- [x] 6. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Integration and polish


  - [x] 7.1 Test complete scan-to-inbound flow


    - Verify camera opens correctly
    - Verify QR code scanning works
    - Verify item lookup and inbound modal display
    - Verify inbound operation completes successfully
    - _Requirements: 2.1-2.5, 4.1-4.3_

  - [x] 7.2 Add loading states and user feedback

    - Add loading spinner during API calls
    - Add success/error toast notifications
    - _Requirements: 4.3_


- [x] 8. Final Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.
