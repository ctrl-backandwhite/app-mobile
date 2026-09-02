export interface Credentials {
  readonly email: string
  readonly password: string
  readonly otp?: string
}

export interface RegisterInput {
  readonly email: string
  readonly password: string
  readonly firstName?: string
  readonly lastName1?: string
  readonly displayName?: string
  readonly companyName?: string
  readonly country?: string
  readonly language?: string
  readonly acceptedTerms: boolean
  readonly acceptedTermsVersion?: string
  readonly marketingOptIn?: boolean
}
