"use client"
import React from "react";
import { Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Link } from "@nextui-org/react";
import { signUp, CodeDeliveryDetails, confirmSignUp, autoSignIn, type ConfirmSignUpInput } from "aws-amplify/auth";
import { logger } from "@/lib/utils";
import { useRouter } from 'next/navigation'

type SignUpProps = {
  password: string;
  email: string;
  firstname: string;
  middlename: string;
  lastname: string;
  phone_number?: string
}

function useDisclosure() {
  const [isOpen, setIsOpen] = React.useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);
  const onOpenChange = () => setIsOpen(!isOpen);

  return { isOpen, onOpen, onClose, onOpenChange };
}

async function handleSignUp({ email, firstname, lastname, middlename, password, phone_number }: SignUpProps) {
  try {
    let { isSignUpComplete, nextStep, userId } = await signUp({
      username: email,
      password: password,
      options: {
        autoSignIn: true,
        userAttributes: {
          family_name: lastname,
          name: firstname,
          email: email,
        },
      },
    });

    if (nextStep) {
      return { nextStep }
    }

    if (isSignUpComplete) {
      return { isSignUpComplete }
    }

  } catch (error) {
    console.log("error signing up:", JSON.stringify(error, null, 2));
    return { error }
  }
}

//Collect the users information and send it to the handleSignUp function
export function SignUpModal() {

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const router = useRouter();

  const [passwordError, setPasswordError] = React.useState("");
  const [isPasswordValid, setIsPasswordValid] = React.useState(false);

  const validatePassword = (password: string) => {
    const regex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\^$*.\[\]{}()?\-"!@#%&/\\,><':;|_~`+=]).{8,}$/;
    const isValid = regex.test(password);
    setIsPasswordValid(isValid);
    setPasswordError(isValid ? "" : "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character.");
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    validatePassword(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    setPending(!pending)
    e.preventDefault();
    let formData = Object.fromEntries(new FormData(e.target as HTMLFormElement)) as SignUpProps
    setusersEmailAddress(formData.email)
    let signUpRes = await handleSignUp({ ...formData })
    logger('SUM', 'HS', `${JSON.stringify(signUpRes, null, 2)}`, 'debug')
    if (signUpRes?.nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
      setcodeDeliveryDetails(signUpRes.nextStep.codeDeliveryDetails)
      setPending(!pending)
    }
  }

  const [pending, setPending] = React.useState(false);
  const [cddPending, setCddPending] = React.useState(false);
  const [signupError, setSignupError] = React.useState(false);
  const [codeDeliveryDetails, setcodeDeliveryDetails] = React.useState<CodeDeliveryDetails | null>(null);
  const [passwordReset, setPasswordReset] = React.useState({ pr: false, userExists: false });
  const [usersEmailAddress, setusersEmailAddress] = React.useState<string|undefined>(undefined);

  if (passwordReset.pr) {
    return (
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            {passwordReset.userExists ? 'Looks like that email is already in use so we sent a password reset email to that address' : 'Password Reset'}
          </ModalHeader>
          <ModalBody>
            <div>We have sent you a password reset email.</div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onOpenChange}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    )
  }

  if (codeDeliveryDetails) {

    const handleConfirmation = async (e: React.FormEvent) => {
      e.preventDefault();
      setCddPending(!cddPending)
      let formData = Object.fromEntries(new FormData(e.target as HTMLFormElement))
      logger('SUM', 'HC',`${JSON.stringify(formData, null, 2)}`, 'debug')

      
      async function handleSignUpConfirmation({
        username,
        confirmationCode
      }: ConfirmSignUpInput) {
        try {
          const { isSignUpComplete, nextStep } = await confirmSignUp({
            username: username,
            confirmationCode: confirmationCode,
          });
  
          return { isSignUpComplete, nextStep }
          
        } catch (error) {
          if (error instanceof Error) {
            switch (error.name) {
              case "CodeMismatchException":
                setCddPending(false)
                break;
              default:
                console.error(`[handleSignUpConfirmation]: ${JSON.stringify(error, null, 2)}`);
                break;
            }
          }
        }
      }
      
      const hsuc = await handleSignUpConfirmation({confirmationCode: `${formData.confirmationCode}`, username: `${formData.email}`})
      logger('SUM', 'HSUC',`${JSON.stringify(hsuc, null, 2)}`, 'debug')
      setCddPending(!cddPending)
      if (hsuc?.nextStep.signUpStep === 'COMPLETE_AUTO_SIGN_IN') {
        try {
          let autoSignInOutput = await autoSignIn();
          logger('SUM', 'ASIO',`${JSON.stringify(autoSignInOutput, null, 2)}`, 'debug')
        } catch (error) {
          console.log('Error:',error);
        }
        router.push('/dashboard')
      }
      
    }

    return (
      <>
        <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1">Enter Your Confirmation Code</ModalHeader>
            <ModalBody>
              <form onSubmit={handleConfirmation} className='flex flex-col space-y-4'>
                <div>We sent a code to {codeDeliveryDetails.destination}</div>
                <Input
                  label="Confirmation Code"
                  isRequired
                  name="confirmationCode"
                  description="Please enter the code we sent to your email."
                />
                <input
                  type='hidden'
                  name="email"
                  value={usersEmailAddress}
                />
                <Button
                  type="submit"
                  className='w-full'
                  variant="flat"
                  color={cddPending ? 'warning' : 'default'}
                  isLoading={cddPending}
                >
                  {cddPending ? 'Confirming...' : 'Confirm'}
                </Button>
              </form>
            </ModalBody>
            <ModalFooter>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </>
    )
  }

  return (
    <>
      <Link className="font-medium text-white px-4 py-2 rounded-md no-underline inline-block transition duration-300 ease-in-out hover:bg-green-500" onPress={onOpen}>New? Join Now!</Link>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Sign Up</ModalHeader>
              <ModalBody>
                <form onSubmit={handleSubmit} className='flex flex-col space-y-4'>
                  <div className='form-title'>Create a New MySub Account.</div>
                  <Input
                    label="email"
                    isRequired
                    description="Your email address will also be your username."
                    name="email"
                    placeholder='Bernard.Fanning@myschool.edu'
                    type='email'
                  />
                  <Input
                    label="firstname"
                    isRequired
                    name="firstname"
                    placeholder='Bernard'
                    type='string'
                  />
                  <Input
                    label="Middle name"
                    name="middlename"
                    placeholder='Joseph'
                    type='string'
                  />
                  <Input
                    label="Last name"
                    isRequired
                    name="lastname"
                    placeholder='Fanning'
                    type='string'
                  />
                  <Input
                    label="Password"
                    isRequired
                    name="password"
                    type='password'
                    onChange={handlePasswordChange}
                    description={passwordError || <div style={{ whiteSpace: 'pre-line' }}>
                    Password must be at least 8 characters long,
                    <br/>
                    contain at least one uppercase letter,<br/>
                    one lowercase letter,<br/>
                    one number,<br/> and one special character.<br/>
                  </div>}
                    color={passwordError ? "danger" : "default"}
                  />
                  <Button
                    type="submit"
                    className='w-full'
                    variant="flat"
                    color={pending ? 'warning' : isPasswordValid ? 'success' : 'danger'}
                    isLoading={pending}
                    disabled={!isPasswordValid || pending}
                  >
                    {pending ? 'Signing Up...' : signupError ? <div className="bg-color"> </div> : 'Sign Up'}
                  </Button>
                </form>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}