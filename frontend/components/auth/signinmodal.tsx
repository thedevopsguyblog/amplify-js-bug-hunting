"use client"
import React, { use } from 'react'
import { button as buttonStyles, user } from "@nextui-org/theme";
import { Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Link } from "@nextui-org/react";
import { SignUpModal } from './signupmodal';
import { signIn, signOut, autoSignIn, type SignInInput } from 'aws-amplify/auth';
import { useUserAttributesStore } from '@/context/userCtx';
import { logger } from '@/lib/utils';

function useDisclosure() {

  const [isOpen, setIsOpen] = React.useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);
  const onOpenChange = () => setIsOpen(!isOpen);

  return { isOpen, onOpen, onClose, onOpenChange };
}

export function SignInModal() {

  const authed = useUserAttributesStore()

  const [pending, setPending] = React.useState<boolean | undefined>(false)
  const [UserNotFoundException, setUserNotFoundException] = React.useState<boolean | undefined>(undefined)
  const [wrongDetails, setWrongDetails] = React.useState<boolean | undefined>(undefined)
  const [unknownError, setUnknownError] = React.useState<boolean | undefined>(undefined)

  const signInUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true)
    try {
      let formData = Object.fromEntries(new FormData(e.target as HTMLFormElement))
      const { isSignedIn, nextStep } = await signIn({ username: formData.username as string, password: formData.password as string })
      if (isSignedIn) {
        window.location.href = '/dashboard'
        // router.push('/playground') // BUG: When I use .push() the state of the auth button doesnt change - a full page reload is neccessary to trigger an update in the auth context 
        onClose();
      } else {
        logger('SIM',`[nextStep]`,`${nextStep}`, 'debug');
      }
    } catch (error) {
      setPending(false)
      logger('SIM','SIU', `${JSON.stringify(error, null, 2)}`, 'error')
      if (error instanceof Error) {
        switch (error.name) {
          case 'UnexpectedSignInInterruptionException':
            logger('SIM', 'SIU', 'UnexpectedSignInInterruptionException - Something Unkown Happened - please contact support.', 'debug')
            setUnknownError(true)
            setPending(undefined)
            break;
          case 'UserNotFoundException':
            setUserNotFoundException(true)
            break;
          case 'UserAlreadyAuthenticatedException':
            logger('SIM', 'SIU', 'Looks like you already have a session', 'debug')
          case 'NotAuthorizedException':
            logger('SIM', 'SIU', 'Wrong details', 'debug')
            setUserNotFoundException(undefined)
            setWrongDetails(!wrongDetails)
          default:
            logger('SIM', 'SIU', `${JSON.stringify(error, null, 2)}`, 'error')
            break;
        }
      }
    }
  }

  const buttonFn = async () => {
    if (authed) {
      try {
        await signOut()
      } catch (error) {
        logger('SIM',`buttonFn`, `${JSON.stringify(error, null, 2)}`, 'error')
      }
      window.location.href = '/'
      // router.push('/') // BUG: When I use .push() the state of the auth button doesnt change - a full page reload is neccessary to trigger an update in the auth context
    } else {
      onOpen()
    }
  }

  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  if (authed === undefined) {
      <>
        <Button
          className={buttonStyles({ color: "default", radius: "lg", variant: "bordered" })}
          disabled
        >
          Loading...
        </Button>
      </>
  }

  return (
    <>
      <Button
        onPress={buttonFn}
        className={buttonStyles({ color: "default", radius: "lg", variant: "bordered" })}
      >
        {authed ? 'Sign Out' : 'Sign In'}
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          <ModalHeader>Sign In</ModalHeader>
          <ModalBody>
            {/*Allow users to Signup*/}
            <SignUpModal />

            <form onSubmit={signInUser}>
              <Input
                label="username"
                name="username"
                isRequired
                description="Email Address"
                type='email'
              />
              <Input
                label="password"
                isRequired
                description="Password"
                name="password"
                type='password'
              />
              <Button
                type="submit"
                className='w-full'
                variant="flat"
                disabled={pending || UserNotFoundException}
                color={pending || UserNotFoundException ? 'warning' : 'default'}
                isLoading={pending}
              >
                {(unknownError && pending === undefined) ? 'Something went wrong - please contact support' : null}
                {wrongDetails ? 'Incorrect Details - ' : null}
                {UserNotFoundException ? "Please create an account." : (pending && !wrongDetails ? 'Signing In...' : 'Sign In')}
              </Button>
            </form>
          </ModalBody>
          <ModalFooter>
            <Link className="text-white px-4 py-2 rounded-md no-underline inline-block transition duration-300 ease-in-out hover:bg-purple-500" onPress={onOpen}>Forgot Password?</Link>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </>
  )
}
