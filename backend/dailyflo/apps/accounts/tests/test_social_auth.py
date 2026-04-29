"""
tests for social_auth.verify_* — we mock google's remote verifier for CI (no playground token needed).

apple path uses a locally generated rsa key pair + mocked jwks so signature verification is real pyjwt/crypto,
same math production uses against apple's keys.
"""

from __future__ import annotations

import time
from unittest.mock import patch

import jwt
from cryptography.hazmat.primitives.asymmetric import rsa
from django.test import TestCase, override_settings
from jwt.algorithms import RSAAlgorithm

from apps.accounts.social_auth import APPLE_ISSUER
from apps.accounts.social_auth import verify_apple_id_token
from apps.accounts.social_auth import verify_google_id_token


class VerifyGoogleIdTokenTests(TestCase):
    """google branch delegates to google-auth; we mock it so tests never hit google servers."""

    @override_settings(GOOGLE_CLIENT_ID='test-google-client.apps.googleusercontent.com')
    @patch('apps.accounts.social_auth.google_id_token.verify_oauth2_token')
    def test_verify_google_returns_claims_when_google_accepts_token(self, mock_verify):
        # patch target is where the name is looked up — social_auth imports google_id_token, so we patch that module's verify_oauth2_token
        # pretend google validated signature + aud + exp and returned openid claims
        mock_verify.return_value = {
            'sub': 'google-subject-1',
            'email': 'user@gmail.com',
            'email_verified': True,
        }

        claims = verify_google_id_token('fake-jwt-string')

        self.assertEqual(claims['sub'], 'google-subject-1')
        self.assertEqual(claims['email'], 'user@gmail.com')
        mock_verify.assert_called_once()

    @override_settings(GOOGLE_CLIENT_ID='test-google-client.apps.googleusercontent.com')
    @patch(
        'apps.accounts.social_auth.google_id_token.verify_oauth2_token',
        side_effect=ValueError('Token expired'),
    )
    def test_verify_google_raises_value_error_when_google_rejects_expired_token(self, _mock_verify):
        # google-auth raises when exp is in the past — we normalize to ValueError for api handlers
        with self.assertRaises(ValueError) as ctx:
            verify_google_id_token('expired-token')
        self.assertIn('Google token verification failed', str(ctx.exception))

    @override_settings(GOOGLE_CLIENT_ID='test-google-client.apps.googleusercontent.com')
    @patch(
        'apps.accounts.social_auth.google_id_token.verify_oauth2_token',
        side_effect=ValueError('Wrong audience'),
    )
    def test_verify_google_raises_value_error_when_audience_does_not_match(self, _mock_verify):
        # tokens minted for another oauth client fail audience pinning inside google-auth
        with self.assertRaises(ValueError) as ctx:
            verify_google_id_token('wrong-aud-token')
        self.assertIn('Google token verification failed', str(ctx.exception))

    @override_settings(GOOGLE_CLIENT_ID=None)
    def test_verify_google_raises_when_client_id_not_configured(self):
        with self.assertRaises(ValueError) as ctx:
            verify_google_id_token('any')
        self.assertIn('GOOGLE_CLIENT_ID is not configured', str(ctx.exception))


class VerifyAppleIdTokenTests(TestCase):
    """apple path: build a real RS256 jwt with a temp key; mock only http jwks fetch."""

    def _make_rsa_keys_and_jwk(self):
        # small rsa key — fast enough for unit tests; production tokens use same algorithms (RS256 + JWKS shape).
        private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        public_key = private_key.public_key()
        jwk = RSAAlgorithm.to_jwk(public_key, as_dict=True)
        jwk['kid'] = 'unit-test-kid'
        return private_key, jwk

    @override_settings(APPLE_CLIENT_ID='com.dailyflo.app')
    @patch('apps.accounts.social_auth._fetch_apple_public_keys')
    def test_verify_apple_succeeds_with_locally_signed_rs256_and_matching_jwks(self, mock_jwks):
        private_key, jwk = self._make_rsa_keys_and_jwk()
        mock_jwks.return_value = [jwk]

        now = int(time.time())
        payload = {
            'sub': 'apple-subject-xyz',
            'aud': 'com.dailyflo.app',
            'iss': APPLE_ISSUER,
            'iat': now,
            'exp': now + 3600,
        }
        # jwt.encode builds a real RS256 token; verify_apple_id_token jwt.decodes using the public half embedded in jwk.
        token = jwt.encode(payload, private_key, algorithm='RS256', headers={'kid': jwk['kid']})

        claims = verify_apple_id_token(token)

        self.assertEqual(claims['sub'], 'apple-subject-xyz')
        self.assertEqual(claims['aud'], 'com.dailyflo.app')

    @override_settings(APPLE_CLIENT_ID='com.dailyflo.app')
    @patch('apps.accounts.social_auth._fetch_apple_public_keys')
    def test_verify_apple_raises_when_token_expired(self, mock_jwks):
        private_key, jwk = self._make_rsa_keys_and_jwk()
        mock_jwks.return_value = [jwk]

        past = int(time.time()) - 7200
        payload = {
            'sub': 'apple-subject-expired',
            'aud': 'com.dailyflo.app',
            'iss': APPLE_ISSUER,
            'iat': past,
            'exp': past + 60,
        }
        token = jwt.encode(payload, private_key, algorithm='RS256', headers={'kid': jwk['kid']})

        with self.assertRaises(ValueError) as ctx:
            verify_apple_id_token(token)
        self.assertIn('expired', str(ctx.exception).lower())

    @override_settings(APPLE_CLIENT_ID=None)
    def test_verify_apple_raises_when_client_id_not_configured(self):
        with self.assertRaises(ValueError) as ctx:
            verify_apple_id_token('eyJhbGciOiJSUzI1NiJ9.e30.sig')
        self.assertIn('APPLE_CLIENT_ID is not configured', str(ctx.exception))
