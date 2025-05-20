from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from rest_framework.decorators import permission_classes
from rest_framework.permissions import AllowAny


class HomeView(APIView):

    def get(self, request):
        content = {
            "message": """Welcome to the JWT 
                   Authentication page using React Js and Django!"""
        }
        return Response(content)


@permission_classes([AllowAny])
class LogoutView(APIView):

    def post(self, request):

        try:
            refresh_token = request.data["refresh_token"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response(status=status.HTTP_400_BAD_REQUEST)
